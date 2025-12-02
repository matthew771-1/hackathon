import { PublicKey } from "@solana/web3.js";
import { createSolanaRpc } from "@solana/kit";
import { getRpcUrl, APP_CONFIG } from "./config";
import type { DAO, Proposal } from "@/types/dao";

// Initialize RPC connection
const RPC_ENDPOINT = getRpcUrl("devnet");
export const rpc = createSolanaRpc(RPC_ENDPOINT);

// SPL Governance Program ID (used by Solana DAOs)
export const GOVERNANCE_PROGRAM_ID = new PublicKey(APP_CONFIG.solanaDAOs.governanceProgramId);
// Legacy Realms program ID (for backwards compatibility)
export const REALMS_PROGRAM_ID = GOVERNANCE_PROGRAM_ID;

/**
 * Fetch DAO information from Realms
 * TODO: Implement actual Realms data fetching using SPL Governance
 * For now, returns enhanced mock data with better structure
 */
export async function fetchDAOInfo(realmAddress: string): Promise<DAO> {
  try {
    // TODO: Fetch actual data from blockchain
    // Example approach:
    // 1. Get realm account data using PublicKey
    // 2. Parse realm data structure
    // 3. Fetch governance accounts
    // 4. Calculate treasury and member counts

    // For now, return enhanced mock data
    const popularDAO = APP_CONFIG.solanaDAOs.popularDAOs.find(
      (dao) => dao.address === realmAddress
    );

    return {
      name: popularDAO?.name || "Unknown DAO",
      address: realmAddress,
      realm: realmAddress,
      treasury: Math.floor(Math.random() * 5000000) + 100000, // $100k - $5M
      memberCount: Math.floor(Math.random() * 5000) + 100, // 100 - 5k members
      proposalCount: Math.floor(Math.random() * 100) + 5, // 5 - 100 proposals
      description: popularDAO?.description || "A Solana DAO using SPL Governance",
      website: popularDAO?.website,
      token: popularDAO?.token,
      network: popularDAO?.network || "mainnet",
    };
  } catch (error) {
    console.error("Error fetching DAO info:", error);
    throw error;
  }
}

/**
 * Fetch proposals for a DAO
 * TODO: Implement actual proposal fetching from SPL Governance
 */
export async function fetchProposals(realmAddress: string): Promise<Proposal[]> {
  try {
    // TODO: Fetch actual proposals from blockchain
    // Example approach:
    // 1. Get governance accounts for the realm
    // 2. Parse proposal accounts
    // 3. Get vote counts and status
    // 4. Format as Proposal objects

    // For now, return enhanced mock proposals
    const mockProposals: Proposal[] = [
      {
        id: `${realmAddress}-1`,
        title: "Increase Treasury Allocation for Development",
        description:
          "This proposal seeks to increase the treasury allocation for development by 20% to accelerate product development and feature releases. The additional funds will be used to hire more developers and expand the development team.",
        status: "voting",
        votesYes: Math.floor(Math.random() * 200) + 50,
        votesNo: Math.floor(Math.random() * 50) + 10,
        votingEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        proposer: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      },
      {
        id: `${realmAddress}-2`,
        title: "Community Grant Program",
        description:
          "Establish a community grant program to fund innovative projects that benefit the DAO ecosystem. The program will allocate $50,000 per quarter to support community-driven initiatives.",
        status: "voting",
        votesYes: Math.floor(Math.random() * 150) + 30,
        votesNo: Math.floor(Math.random() * 30) + 5,
        votingEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        proposer: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      },
      {
        id: `${realmAddress}-3`,
        title: "Treasury Diversification Strategy",
        description:
          "Proposal to diversify the DAO treasury by converting 30% of holdings to stablecoins (USDC) to reduce volatility risk while maintaining operational liquidity.",
        status: "succeeded",
        votesYes: 250,
        votesNo: 45,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        proposer: "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1",
      },
    ];

    return mockProposals;
  } catch (error) {
    console.error("Error fetching proposals:", error);
    throw error;
  }
}

/**
 * Get popular Solana DAOs
 */
export const POPULAR_SOLANA_DAOS = APP_CONFIG.solanaDAOs.popularDAOs;
// Legacy export for backwards compatibility
export const POPULAR_REALMS = POPULAR_SOLANA_DAOS;

/**
 * Search for DAOs by name or address
 */
export async function searchDAOs(query: string): Promise<DAO[]> {
  try {
    const results: DAO[] = [];
    
    // Search in popular Solana DAOs
    for (const solanaDAO of POPULAR_SOLANA_DAOS) {
      if (
        solanaDAO.name.toLowerCase().includes(query.toLowerCase()) ||
        solanaDAO.address.toLowerCase().includes(query.toLowerCase())
      ) {
        const dao = await fetchDAOInfo(solanaDAO.address);
        results.push(dao);
      }
    }

    return results;
  } catch (error) {
    console.error("Error searching DAOs:", error);
    return [];
  }
}

