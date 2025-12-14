import { createThirdwebClient } from "thirdweb";
import { defineChain } from "thirdweb/chains";

export const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID || "2bb3fd4675c84f38b467997f87c42f5e",
});

export const bscTestnet = defineChain({
  id: 97,
  name: "BSC Testnet",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  rpc: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
  testnet: true,
});