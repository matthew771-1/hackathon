/**
 * Application configuration
 */

export const APP_CONFIG = {
  // Solana network configuration
  solana: {
    devnet: {
      rpc: process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com",
      ws: process.env.NEXT_PUBLIC_SOLANA_WS || "wss://api.devnet.solana.com",
    },
    mainnet: {
      // Read from environment variable (available at build time in Next.js)
      rpc: (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SOLANA_MAINNET_RPC) || "https://api.mainnet-beta.solana.com",
      ws: (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_SOLANA_MAINNET_WS) || "wss://api.mainnet-beta.solana.com",
    },
  },

  // Solana DAO Governance Programs
  solanaDAOs: {
    // SPL Governance Program ID (used by most Solana DAOs)
    governanceProgramId: "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw",
    // Popular Solana DAOs on Mainnet
    popularDAOs: [
      {
        name: "Adrena DAO",
        address: "GWe1VYTRMujAtGVhSLwSn4YPsXBLe5qfkzNAYAKD44Nk",
        description: "Adrena DAO with active proposals",
        network: "mainnet" as const,
        website: "https://v2.realms.today/dao/GWe1VYTRMujAtGVhSLwSn4YPsXBLe5qfkzNAYAKD44Nk",
        token: "ADRENA",
        tokenMint: "G3T7ZLw2UHLejCQe3LxdUgme7kqRrNq379sLd95iJdEv", // Adrena governance token mint
        image: "/adrena.jpg",
        // Specific governance addresses for this DAO
        governanceAddresses: [
          "HgeoVqTTMQ9K5GZAUpPKaz5PS8Rn55yR5e5SwmB3DbKB",
          "HbzDAYnhidh35woSLmbqCgvjc52ZUPPQfN1fGDa7CTXx",
        ],
        // Treasury wallet address
        treasuryAddress: "7VzEXYvGmLg3tdVuFuGFQdr7GP5tutTUt8EcTGHvG8Ev",
      },
    ],
  },

  // AI Agent defaults
  aiAgent: {
    defaultRiskTolerance: "moderate" as const,
    defaultMinConfidence: 70,
    defaultAutoVote: true,
  },

  // UI configuration
  ui: {
    itemsPerPage: 10,
    animationDuration: 300,
  },
} as const;

/**
 * Get RPC URL based on network
 */
export function getRpcUrl(network: "devnet" | "mainnet" = "devnet"): string {
  return APP_CONFIG.solana[network].rpc;
}

/**
 * Get WebSocket URL based on network
 */
export function getWsUrl(network: "devnet" | "mainnet" = "devnet"): string {
  return APP_CONFIG.solana[network].ws;
}

