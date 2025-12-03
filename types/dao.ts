export interface DAO {
  name: string;
  address: string;
  realm: string; // Governance program address
  treasury: number;
  memberCount: number;
  proposalCount: number;
  description?: string;
  website?: string;
  token?: string;
  network?: "devnet" | "mainnet";
  image?: string;
  governanceAddresses?: string[]; // Specific governance account addresses
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: "draft" | "voting" | "succeeded" | "defeated" | "executed" | "cancelled";
  votesYes: number;
  votesNo: number;
  votingEndsAt?: Date;
  createdAt: Date;
  proposer: string;
}

export interface AIAgent {
  id: string;
  name: string;
  personality: string;
  votingPreferences: VotingPreferences;
  createdAt: Date;
  isActive: boolean;
}

export interface VotingPreferences {
  riskTolerance: "conservative" | "moderate" | "aggressive";
  focusAreas: string[];
  minVotingThreshold?: number;
  autoVote: boolean;
}

