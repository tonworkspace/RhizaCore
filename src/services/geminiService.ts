import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables. Gemini features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getMiningOptimizationTip = async (): Promise<string> => {
  const client = getClient();
  if (!client) return "System Offline: AI Link unstable. Please check API Key configuration.";

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate a short, cryptic, cyberpunk-style system message (max 15 words) about optimizing a node mining operation. It should sound like a terminal success message.",
    });
    
    return response.text?.trim() || "Mining optimization completed.";
  } catch (error) {
    console.error("Failed to fetch mining tip:", error);
    return "Optimization routine executed locally. Efficiency increased.";
  }
};