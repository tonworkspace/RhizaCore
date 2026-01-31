// Create a new file for API functions
export const getTONPrice = async (): Promise<number> => {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd'
    );
    const data = await response.json();
    return data['the-open-network'].usd;
  } catch (error) {
    console.error('Error fetching TON price:', error);
    return 2.5; // Fallback price if API fails
  }
};

/**
 * TON Balance API Integration
 * Fetches balance data from TON API
 */
export interface TONAccountResponse {
  balance: string; // Balance in nanotons
  status: string;
  last_activity: number;
  address: {
    bounceable: string;
    non_bounceable: string;
    raw: string;
  };
}

export const getTONBalance = async (address: string): Promise<TONAccountResponse> => {
  const response = await fetch(`https://tonapi.io/v2/accounts/${address}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer AHZ25K6GOTNFOVQAAAAGWQBCDALGUCPWSHPKL2KQBMUPYIZ4XTQ6ZKHEEONHPY57RXQWUCI'
    }
  });

  if (!response.ok) {
    throw new Error(`TON API request failed: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Convert nanotons to TON
 */
export const nanotonToTON = (nanotons: string | number): number => {
  const nanotonValue = typeof nanotons === 'string' ? parseInt(nanotons) : nanotons;
  return nanotonValue / 1e9;
};

/**
 * Format TON balance for display
 */
export const formatTONBalance = (balance: number): string => {
  if (balance === 0) return '0.00';
  if (balance < 0.01) return balance.toFixed(6);
  if (balance < 1) return balance.toFixed(4);
  if (balance < 1000) return balance.toFixed(2);
  
  return balance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}; 