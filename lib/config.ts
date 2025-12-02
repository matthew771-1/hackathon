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
      rpc: "https://api.mainnet-beta.solana.com",
      ws: "wss://api.mainnet-beta.solana.com",
    },
  },

  // Solana DAO Governance Programs
  solanaDAOs: {
    // SPL Governance Program ID (used by most Solana DAOs)
    governanceProgramId: "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw",
    // Popular Solana DAOs on Mainnet
    popularDAOs: [
      {
        name: "Mango DAO",
        address: "4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7d4BLWLqK8HqR",
        description: "Governs Mango Markets - decentralized trading platform for margin trading, lending, and perpetual futures",
        network: "mainnet" as const,
        website: "https://mango.markets",
        token: "MNGO",
      },
      {
        name: "Jupiter DAO",
        address: "Gq3v8s5t2vN9mP3qR7sF6PY2zACB6FD7n2mXi9s6t7V3",
        description: "Governs Jupiter - Solana's leading DEX aggregator and swap platform",
        network: "mainnet" as const,
        website: "https://jup.ag",
        token: "JUP",
      },
      {
        name: "MonkeDAO",
        address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        description: "Solana's first community-owned and operated NFT DAO, serving as a premier Web3.0 country club",
        network: "mainnet" as const,
        website: "https://monkedao.io",
        token: "MONKE",
      },
      {
        name: "Marinade DAO",
        address: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
        description: "Governs Marinade Finance - liquid staking protocol for Solana that mints mSOL (Marinade SOL)",
        network: "mainnet" as const,
        website: "https://marinade.finance",
        token: "MNDE",
      },
      {
        name: "Helium DAO",
        address: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
        description: "Governs the Helium Network - decentralized wireless infrastructure and IoT network on Solana",
        network: "mainnet" as const,
        website: "https://www.helium.com",
        token: "HNT",
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

