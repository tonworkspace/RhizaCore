import { JettonBalance } from "@ton-api/client";

export interface JettonRegistryData {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  image: string;
  verified: boolean;
  rateUsd: number;
}

// Minimal in-app registry cache. This mirrors public/jetton-registry.json
// so lookups are synchronous for UI rendering.
const STATIC_REGISTRY: Record<string, Omit<JettonRegistryData, "address">> = {
  // STK (two forms + raw)
  "EQBObyiP7EtGDBxWV--eZYAB-o8U8RuGL7kPZELbu-cTufNr": {
    verified: true,
    symbol: "STK",
    name: "Stakers Token",
    decimals: 18,
    image: "https://storage.dyor.io/jettons/images/1759255309/19733916.png",
    rateUsd: 0.0000012,
  },
  "EQAUKh4-GWW_WHNzd_2QBR1MJIOplG685gE-SlHf9mC0WDQx": {
    verified: true,
    symbol: "STK",
    name: "Stakers Token",
    decimals: 18,
    image: "https://storage.dyor.io/jettons/images/1759255309/19733916.png",
    rateUsd: 0,
  },
  "0:4e6f288fec4b460c1c5657ef9e658001fa8f14f11b862fb90f6442dbbbe713b9": {
    verified: true,
    symbol: "STK",
    name: "Stakers Token",
    decimals: 18,
    image: "https://storage.dyor.io/jettons/images/1759255309/19733916.png",
    rateUsd: 0,
  },
  // USDT
  "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs": {
    verified: true,
    symbol: "USD₮",
    name: "Tether USD",
    decimals: 6,
    image: "https://tether.to/images/logoCircle.png",
    rateUsd: 1.0,
  },
  "0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe": {
    verified: true,
    symbol: "USD₮",
    name: "Tether USD",
    decimals: 6,
    image: "https://tether.to/images/logoCircle.png",
    rateUsd: 1.0,
  },
};

function normalizeAddress(address: string): string {
  if (!address) return address;
  // tonapi returns user-friendly addresses; also support raw 0:... form
  return address.trim();
}

export function getJettonRegistryData(address: string): JettonRegistryData | null {
  const key = normalizeAddress(address);
  const entry = STATIC_REGISTRY[key];
  if (!entry) return null;
  return { address: key, ...entry };
}

export function enhanceJettonData(
  jetton: JettonBalance,
  registryData?: JettonRegistryData
): JettonBalance & { jetton: typeof jetton.jetton & { verified?: boolean; description?: string; image?: string; symbol?: string; name?: string } } {
  if (!registryData) {
    return {
      ...jetton,
      jetton: {
        ...jetton.jetton,
        verified: false,
        description: undefined,
      },
    };
  }

  return {
    ...jetton,
    jetton: {
      ...jetton.jetton,
      verified: registryData.verified,
      name: registryData.name || jetton.jetton.name,
      symbol: registryData.symbol || jetton.jetton.symbol,
      image: registryData.image || (jetton as any).jetton?.image,
      // description is optional in our UI
      description: (jetton as any).jetton?.description,
    },
  };
}
