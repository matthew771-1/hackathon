import { PublicKey, Connection } from "@solana/web3.js";
import { createSolanaRpc } from "@solana/kit";
import {
  getGovernanceAccounts,
  getRealm,
  GovernanceAccountType,
  ProposalState,
  Proposal,
  Realm,
} from "@solana/spl-governance";
import { Governance, Proposal as ProposalAccount } from "@solana/spl-governance/lib/governance/accounts";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { getRpcUrl, APP_CONFIG } from "./config";
import type { DAO, Proposal as ProposalType } from "@/types/dao";

// Cache for fetched proposals to avoid re-fetching on every modal open
const proposalCache = new Map<string, { proposals: ProposalType[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Track in-flight requests to prevent duplicate fetches
const inFlightRequests = new Map<string, Promise<ProposalType[]>>();

// Store for dynamically added DAOs (not in config)
const dynamicDAOs = new Map<string, { governanceAddresses?: string[]; network?: "mainnet" | "devnet" }>();

// Initialize RPC connection
const RPC_ENDPOINT = getRpcUrl("devnet");
export const rpc = createSolanaRpc(RPC_ENDPOINT);

// Create Connection for SPL Governance
function getConnection(network: "devnet" | "mainnet" = "mainnet"): Connection {
  // Get RPC URL - read environment variable directly
  // In Next.js, NEXT_PUBLIC_ vars are embedded at build time and available via process.env
  let rpcUrl: string;
  
  if (network === "mainnet") {
    // Read directly from process.env (Next.js makes this available client-side)
    // Fallback to config if not set
    const envRpc = process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC;
    rpcUrl = envRpc || APP_CONFIG.solana.mainnet.rpc;
    
    // Debug logging
    console.log("RPC Configuration:", {
      hasEnvVar: !!envRpc,
      envVarValue: envRpc ? `${envRpc.substring(0, 40)}...` : "not set",
      configRpc: APP_CONFIG.solana.mainnet.rpc.substring(0, 40) + "...",
      usingRpc: rpcUrl.substring(0, 50) + "...",
      allEnvKeys: Object.keys(process.env).filter(k => k.includes("SOLANA")),
    });
  } else {
    rpcUrl = APP_CONFIG.solana.devnet.rpc;
  }
  
  console.log(`Using RPC endpoint: ${rpcUrl}`);
  
  return new Connection(rpcUrl, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 60000,
    httpHeaders: {
      // Some RPC providers require headers
    },
  });
}

// SPL Governance Program ID (used by Solana DAOs)
export const GOVERNANCE_PROGRAM_ID = new PublicKey(APP_CONFIG.solanaDAOs.governanceProgramId);
// Legacy Realms program ID (for backwards compatibility)
export const REALMS_PROGRAM_ID = GOVERNANCE_PROGRAM_ID;

/**
 * Fetch DAO information from the blockchain
 */
export async function fetchDAOInfo(realmAddress: string): Promise<DAO> {
  try {
    // Validate address format first
    if (!realmAddress || typeof realmAddress !== "string") {
      throw new Error("Invalid realm address: address must be a non-empty string");
    }

    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(realmAddress)) {
      throw new Error(`Invalid Solana address format: ${realmAddress}`);
    }

    const popularDAO = APP_CONFIG.solanaDAOs.popularDAOs.find(
      (dao) => dao.address === realmAddress
    );
    const network = popularDAO?.network || "mainnet";
    
    let connection;
    try {
      connection = getConnection(network);
      if (!connection) {
        throw new Error("Failed to create Solana connection");
      }
    } catch (connError: any) {
      console.error("Error creating connection:", connError);
      throw new Error(`Failed to connect to Solana ${network}: ${connError?.message || "Unknown error"}`);
    }

    let realmPubkey;
    try {
      realmPubkey = new PublicKey(realmAddress);
    } catch (pkError: any) {
      console.error("Error creating PublicKey:", pkError);
      throw new Error(`Invalid public key format: ${pkError?.message || "Unknown error"}`);
    }
    const governanceProgramId = GOVERNANCE_PROGRAM_ID;

    // Fetch realm data
    let realmData: Realm | null = null;
    let realmName: string | undefined;
    let proposalCount = 0;
    let memberCount = 0;

    try {
      const realmAccount = await getRealm(connection, realmPubkey);
      realmData = realmAccount.account;
      realmName = realmData.name;
      
      // Try to get proposal count from cache if available
      const cached = proposalCache.get(realmAddress);
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        // Use cached proposals count
        const activeCount = cached.proposals.filter(p => 
          p.status === "draft" || p.status === "voting"
        ).length;
        proposalCount = activeCount;
      } else {
        // Will be updated when proposals are fetched in the UI
        proposalCount = 0;
      }

      // Get token owner records count as member count
      // Note: This requires complex filtering - simplified for now
      // TODO: Implement proper token owner record counting with correct filters
      memberCount = 0;
    } catch (error) {
      console.warn("Error fetching realm data, using fallback:", error);
      // If realm fetch fails, we'll use the popularDAO data
    }

    // Calculate treasury - check if treasury address is provided in config, otherwise try to calculate
    let treasury = 0;
    try {
      const treasuryAddress = (popularDAO as any)?.treasuryAddress;
      
      if (treasuryAddress) {
        // If treasury address is provided, fetch balance directly
        try {
          const treasuryPubkey = new PublicKey(treasuryAddress);
          const balance = await connection.getBalance(treasuryPubkey);
          treasury = balance / 1e9; // Convert lamports to SOL
        } catch (error) {
          console.debug("Error fetching treasury balance:", error);
        }
      } else if (realmData) {
        // Fallback: try to get community token mint and check associated token account
        const communityMint = realmData.communityMint;
        if (communityMint) {
          try {
            const ata = await getAssociatedTokenAddress(
              communityMint,
              realmPubkey,
              true // allowOwnerOffCurve
            );
            const account = await getAccount(connection, ata);
            // Convert to a readable number (assuming 6-9 decimals)
            const decimals = account.mint ? 9 : 6; // Default to 9 for SOL-like tokens
            treasury = Number(account.amount) / Math.pow(10, decimals);
          } catch (error) {
            // ATA might not exist or might not be the treasury
            console.debug("Could not fetch treasury from ATA:", error);
          }
        }
      }
    } catch (error) {
      console.debug("Error calculating treasury:", error);
      treasury = 0;
    }

    const dynamicDAO = dynamicDAOs.get(realmAddress);
    return {
      name: realmName || popularDAO?.name || "Unknown DAO",
      address: realmAddress,
      realm: realmAddress,
      treasury,
      memberCount,
      proposalCount,
      description: popularDAO?.description || realmName || "A Solana DAO using SPL Governance",
      website: popularDAO?.website,
      token: popularDAO?.token,
      tokenMint: (popularDAO as any)?.tokenMint,
      network,
      image: (popularDAO as any)?.image,
      governanceAddresses: (popularDAO as any)?.governanceAddresses || dynamicDAO?.governanceAddresses,
    };
  } catch (error) {
    console.error("Error fetching DAO info:", error);
    // Fallback to basic data from config
    const popularDAO = APP_CONFIG.solanaDAOs.popularDAOs.find(
      (dao) => dao.address === realmAddress
    );
    return {
      name: popularDAO?.name || "Unknown DAO",
      address: realmAddress,
      realm: realmAddress,
      treasury: 0,
      memberCount: 0,
      proposalCount: 0,
      description: popularDAO?.description || "A Solana DAO using SPL Governance",
      website: popularDAO?.website,
      token: popularDAO?.token,
      tokenMint: (popularDAO as any)?.tokenMint,
      network: popularDAO?.network || "mainnet",
      image: (popularDAO as any)?.image,
    };
  }
}

/**
 * Fetch proposals for a DAO from the blockchain
 * Uses caching to avoid re-fetching on every modal open
 */
export async function fetchProposals(realmAddress: string): Promise<ProposalType[]> {
  // Check cache first
  const cached = proposalCache.get(realmAddress);
  const now = Date.now();
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log(`✅ Using cached proposals for ${realmAddress} (${cached.proposals.length} proposals)`);
    return cached.proposals;
  }

  // Check if there's already an in-flight request for this DAO
  const inFlight = inFlightRequests.get(realmAddress);
  if (inFlight) {
    console.log(`⏳ Reusing in-flight request for ${realmAddress}`);
    return inFlight;
  }

  // Create a new fetch promise
  const fetchPromise = (async () => {
    try {
      const popularDAO = APP_CONFIG.solanaDAOs.popularDAOs.find(
        (dao) => dao.address === realmAddress
      );
      const dynamicDAO = dynamicDAOs.get(realmAddress);
      const network = popularDAO?.network || dynamicDAO?.network || "mainnet";
      const connection = getConnection(network);
      
      const realmPubkey = new PublicKey(realmAddress);
      const governanceProgramId = GOVERNANCE_PROGRAM_ID;

      const allProposals: ProposalType[] = [];

      // Map SPL Governance ProposalState to our Proposal status
      const mapProposalState = (state: ProposalState): ProposalType["status"] => {
        switch (state) {
          case ProposalState.Draft:
            return "draft";
          case ProposalState.SigningOff:
          case ProposalState.Voting:
            return "voting";
          case ProposalState.Succeeded:
            return "succeeded";
          case ProposalState.Defeated:
            return "defeated";
          case ProposalState.Executing:
          case ProposalState.Completed:
            return "executed";
          case ProposalState.Cancelled:
            return "cancelled";
          default:
            return "draft";
        }
      };
      
      // First, verify the realm exists
      let realmAccount;
      try {
        realmAccount = await getRealm(connection, realmPubkey);
        console.log(`✅ Realm found: ${realmAccount.account.name}`);
      } catch (error) {
        console.error(`❌ Error fetching realm ${realmAddress}:`, error);
        return [];
      }

      // Fetch governance accounts for this realm
      // First check if manually configured, otherwise fetch from blockchain
      const configuredGovernanceAddresses = (popularDAO as any)?.governanceAddresses as string[] | undefined;
      const dynamicGovernanceAddresses = dynamicDAO?.governanceAddresses;
      
      let effectiveGovernancePubkeys: PublicKey[] = [];

      if (configuredGovernanceAddresses && configuredGovernanceAddresses.length > 0) {
        // Use manually configured governance addresses (for backwards compatibility)
        console.log(`Using configured governance addresses for ${realmAddress}:`, configuredGovernanceAddresses);
        effectiveGovernancePubkeys = configuredGovernanceAddresses.map(addr => new PublicKey(addr));
      } else if (dynamicGovernanceAddresses && dynamicGovernanceAddresses.length > 0) {
        // Use dynamically added governance addresses
        console.log(`Using dynamic governance addresses for ${realmAddress}:`, dynamicGovernanceAddresses);
        effectiveGovernancePubkeys = dynamicGovernanceAddresses.map(addr => new PublicKey(addr));
      } else {
        // Automatically fetch governance accounts from the realm
        console.log(`No governance addresses configured. Fetching governance accounts for realm ${realmAddress}...`);
        try {
          // Fetch all Governance accounts that belong to this realm
          // Governance accounts have a 'realm' field that links them to the realm
          const governanceAccounts = await getGovernanceAccounts(
            connection,
            governanceProgramId,
            Governance
          );
          
          // Filter governance accounts by realm
          const realmPubkeyStr = realmPubkey.toBase58();
          const realmGovernanceAccounts = governanceAccounts.filter((govAccount) => {
            try {
              const governance = govAccount.account as Governance;
              const govRealm = (governance as any).realm;
              if (!govRealm) return false;
              
              const govRealmPubkey = govRealm instanceof PublicKey 
                ? govRealm 
                : typeof govRealm === 'string'
                ? new PublicKey(govRealm)
                : new PublicKey(govRealm.toBase58?.() || govRealm.toString());
              
              return govRealmPubkey.toBase58() === realmPubkeyStr;
            } catch {
              return false;
            }
          });
          
          if (realmGovernanceAccounts.length === 0) {
            console.warn(`⚠️ No governance accounts found for realm ${realmAddress}`);
            return [];
          }
          
          // Extract governance pubkeys
          effectiveGovernancePubkeys = realmGovernanceAccounts.map(govAccount => govAccount.pubkey);
          console.log(`✅ Found ${effectiveGovernancePubkeys.length} governance accounts for realm ${realmAddress}:`, 
            effectiveGovernancePubkeys.map(gp => gp.toBase58()));
        } catch (error) {
          console.error(`❌ Error fetching governance accounts for realm ${realmAddress}:`, error);
          return [];
        }
      }
      
      // Fetch proposals - use efficient approach
      let allProposalsUnfiltered: any[] = [];
      
      if (effectiveGovernancePubkeys.length > 0) {
        // If we have configured governance addresses, fetch all proposals and filter by them
        console.log(`Fetching proposals for ${effectiveGovernancePubkeys.length} governance accounts...`);
        console.log(`Looking for governance addresses:`, effectiveGovernancePubkeys.map(gp => gp.toBase58()));
        try {
          const allProposals = await getGovernanceAccounts(
            connection,
            governanceProgramId,
            ProposalAccount
          );
          
          console.log(`Fetched ${allProposals.length} total proposals from blockchain (before filtering)`);
          
          // Filter proposals by governance addresses
          const governancePubkeySet = new Set(effectiveGovernancePubkeys.map(gp => gp.toBase58()));
          let matchedCount = 0;
          let skippedCount = 0;
          
          for (const proposalAccount of allProposals) {
            try {
              const proposal = proposalAccount.account as Proposal;
              // Access the governance field - it should be a PublicKey
              const proposalGov = (proposal as any).governance;
              
              if (!proposalGov) {
                skippedCount++;
                if (skippedCount <= 3) {
                  console.debug(`Proposal ${proposalAccount.pubkey.toBase58()} has no governance field. Keys:`, Object.keys(proposal).slice(0, 10));
                }
                continue;
              }
              
              let proposalGovPubkey: PublicKey;
              try {
                if (proposalGov instanceof PublicKey) {
                  proposalGovPubkey = proposalGov;
                } else if (typeof proposalGov === 'string') {
                  proposalGovPubkey = new PublicKey(proposalGov);
                } else if (proposalGov.toBase58 && typeof proposalGov.toBase58 === 'function') {
                  proposalGovPubkey = new PublicKey(proposalGov.toBase58());
                } else if (proposalGov.toString && typeof proposalGov.toString === 'function') {
                  proposalGovPubkey = new PublicKey(proposalGov.toString());
                } else {
                  // Try to access as a property that might be a PublicKey
                  const govStr = String(proposalGov);
                  proposalGovPubkey = new PublicKey(govStr);
                }
              } catch (e) {
                skippedCount++;
                if (skippedCount <= 3) {
                  console.debug(`Error converting governance for proposal ${proposalAccount.pubkey.toBase58()}:`, e, 'governance value:', proposalGov);
                }
                continue;
              }
              
              const proposalGovStr = proposalGovPubkey.toBase58();
              if (governancePubkeySet.has(proposalGovStr)) {
                allProposalsUnfiltered.push(proposalAccount);
                matchedCount++;
              } else if (matchedCount === 0 && allProposalsUnfiltered.length === 0 && skippedCount <= 5) {
                // Log first few mismatches for debugging
                console.debug(`Proposal ${proposalAccount.pubkey.toBase58()} governance ${proposalGovStr} not in set. Looking for:`, Array.from(governancePubkeySet));
              }
            } catch (error) {
              skippedCount++;
              if (skippedCount <= 3) {
                console.debug(`Error processing proposal ${proposalAccount.pubkey.toBase58()}:`, error);
              }
            }
          }
          
          console.log(`Filtered results: ${matchedCount} matched, ${skippedCount} skipped, ${allProposalsUnfiltered.length} total after filtering`);
          
          // Count proposals per governance
          const counts = new Map<string, number>();
          for (const proposalAccount of allProposalsUnfiltered) {
            try {
              const proposal = proposalAccount.account as Proposal;
              const proposalGov = (proposal as any).governance || 
                                 (proposal as any).governancePubkey ||
                                 (proposalAccount as any).governance;
              if (proposalGov) {
                let govKey: string;
                if (proposalGov instanceof PublicKey) {
                  govKey = proposalGov.toBase58();
                } else if (typeof proposalGov === 'string') {
                  govKey = proposalGov;
                } else {
                  govKey = proposalGov.toBase58?.() || proposalGov.toString();
                }
                counts.set(govKey, (counts.get(govKey) || 0) + 1);
              }
            } catch {}
          }
          counts.forEach((count, gov) => {
            console.log(`Found ${count} proposals for governance ${gov}`);
          });
        } catch (error: any) {
          console.error("Error fetching proposals:", error);
          if (error?.message?.includes("403") || error?.code === 403 || error?.error?.code === 403) {
            console.error("⚠️ RPC rate limit (403). Please set NEXT_PUBLIC_SOLANA_MAINNET_RPC in .env.local");
          }
          return [];
        }
      }

      console.log(`Fetched ${allProposalsUnfiltered.length} total proposals from blockchain`);

      for (const proposalAccount of allProposalsUnfiltered) {
        try {
          const proposal = proposalAccount.account as Proposal;
          
          // If we already filtered by governance, all proposals here belong to the realm
          // Otherwise, check if this proposal belongs to one of our realm's governance accounts
          let belongsToRealm = true; // Default to true if we pre-filtered
          
          if (effectiveGovernancePubkeys.length === 0 || !configuredGovernanceAddresses) {
            // Only check if we didn't pre-filter
            const proposalGov = (proposal as any).governance;
            if (!proposalGov) {
              console.debug(`Proposal ${proposalAccount.pubkey.toBase58()} has no governance field`);
              continue;
            }

            belongsToRealm = false;
            try {
              const govPubkey = typeof proposalGov === 'string' 
                ? new PublicKey(proposalGov) 
                : proposalGov instanceof PublicKey 
                ? proposalGov 
                : new PublicKey(proposalGov.toBase58?.() || proposalGov.toString());
              
              // Check if governance is in our list
              belongsToRealm = effectiveGovernancePubkeys.some(gp => gp.equals(govPubkey));
              
              if (!belongsToRealm) {
                // Fallback: try to check governance accounts
                const governanceAccounts = await getGovernanceAccounts(
                  connection,
                  governanceProgramId,
                  Governance
                );
                const govAccount = governanceAccounts.find(g => g.pubkey.equals(govPubkey));
                if (govAccount) {
                  const gov = govAccount.account as any;
                  belongsToRealm = gov.realm?.equals?.(realmPubkey) || 
                                  gov.realmPubkey?.equals?.(realmPubkey) ||
                                  (gov.realm && new PublicKey(gov.realm).equals(realmPubkey)) ||
                                  false;
                }
              }
            } catch (error) {
              console.debug(`Error checking governance for proposal ${proposalAccount.pubkey}:`, error);
              belongsToRealm = false; // Skip if we can't verify
            }

            if (!belongsToRealm) {
              console.debug(`Proposal ${proposalAccount.pubkey.toBase58()} does not belong to realm ${realmAddress}`);
              continue;
            }
          }
          
          // Extract title and description from proposal metadata
          const proposalPubkey = proposalAccount.pubkey.toBase58();
          const title = (proposal as any).name || `Proposal ${proposalPubkey.slice(0, 8)}`;
          const description = (proposal as any).descriptionLink 
            ? `View full proposal: ${(proposal as any).descriptionLink}`
            : "Proposal details available on Realms";

          // Calculate vote counts - access properties directly from Proposal object
          let yesVotes = 0;
          let noVotes = 0;
          try {
            // The Proposal object from @solana/spl-governance stores vote counts in different ways
            // Try multiple property names and methods
            const voteType = (proposal as any).voteType;
            
            // Try accessing vote counts via different property names
            let yesCount = (proposal as any).yesVotesCount || 
                          (proposal as any).yesVoteCount ||
                          (proposal as any).yesVotes ||
                          (proposal as any).getYesVoteCount?.();
            
            let noCount = (proposal as any).noVotesCount || 
                         (proposal as any).noVoteCount ||
                         (proposal as any).noVotes ||
                         (proposal as any).getNoVoteCount?.();
            
            // Handle BN (BigNumber) objects or numbers
            if (yesCount !== undefined && yesCount !== null) {
              if (typeof yesCount.toNumber === 'function') {
                yesVotes = yesCount.toNumber();
              } else if (typeof yesCount.toString === 'function') {
                // Try parsing as string if it's a BN
                const num = Number(yesCount.toString());
                yesVotes = isNaN(num) ? 0 : num;
              } else {
                yesVotes = Number(yesCount) || 0;
              }
            }
            
            if (noCount !== undefined && noCount !== null) {
              if (typeof noCount.toNumber === 'function') {
                noVotes = noCount.toNumber();
              } else if (typeof noCount.toString === 'function') {
                // Try parsing as string if it's a BN
                const num = Number(noCount.toString());
                noVotes = isNaN(num) ? 0 : num;
              } else {
                noVotes = Number(noCount) || 0;
              }
            }
            
            // Debug logging for first few proposals to understand the structure
            // (Only log first 3 to avoid spam)
            const proposalIndex = allProposals.length;
            if (proposalIndex < 3) {
              console.log(`Proposal ${proposalPubkey} vote extraction:`, {
                voteType,
                yesCount: yesCount?.toString?.() || yesCount,
                noCount: noCount?.toString?.() || noCount,
                yesVotes,
                noVotes,
                proposalKeys: Object.keys(proposal).slice(0, 20),
              });
            }
          } catch (error) {
            // If accessing vote counts fails, log and continue
            console.debug(`Error extracting vote counts for proposal ${proposalPubkey}:`, error);
            yesVotes = 0;
            noVotes = 0;
          }

          // Get voting end time - handle BN objects for timestamps
          let votingEndsAt: Date | undefined = undefined;
          try {
            const votingCompletedAt = (proposal as any).votingCompletedAt;
            const votingAt = (proposal as any).votingAt;
            const maxVotingTime = (proposal as any).maxVotingTime;
            
            if (votingCompletedAt) {
              // Voting has completed
              const timestamp = typeof votingCompletedAt.toNumber === 'function' 
                ? votingCompletedAt.toNumber() 
                : Number(votingCompletedAt);
              votingEndsAt = new Date(timestamp * 1000);
            } else if (votingAt && maxVotingTime) {
              // Voting is in progress, calculate end time
              const startTime = typeof votingAt.toNumber === 'function' 
                ? votingAt.toNumber() 
                : Number(votingAt);
              const duration = typeof maxVotingTime.toNumber === 'function' 
                ? maxVotingTime.toNumber() 
                : Number(maxVotingTime);
              votingEndsAt = new Date((startTime + duration) * 1000);
            }
          } catch (error) {
            console.debug(`Error calculating voting end time for proposal ${proposalPubkey}:`, error);
          }

          const proposalData: ProposalType = {
            id: proposalPubkey, // Use real proposal public key as ID
            title,
            description,
            status: mapProposalState(proposal.state),
            votesYes: yesVotes,
            votesNo: noVotes,
            votingEndsAt,
            createdAt: (() => {
              try {
                const draftAt = (proposal as any).draftAt;
                if (draftAt) {
                  const timestamp = typeof draftAt.toNumber === 'function' 
                    ? draftAt.toNumber() 
                    : Number(draftAt);
                  return new Date(timestamp * 1000);
                }
                return new Date();
              } catch {
                return new Date();
              }
            })(),
            proposer: (proposal as any).tokenOwnerRecord?.toBase58() || proposalPubkey,
          };

          allProposals.push(proposalData);
        } catch (error) {
          console.error(`Error processing proposal ${proposalAccount.pubkey}:`, error);
          // Continue with other proposals
        }
      }

      // Sort by creation date (newest first)
      allProposals.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // If no proposals found, log for debugging
      if (allProposals.length === 0) {
        console.warn(`No proposals found for realm ${realmAddress}`);
        return [];
      }
      
      console.log(`✅ Found ${allProposals.length} proposals for realm ${realmAddress}`);

      // Cache the results
      proposalCache.set(realmAddress, { proposals: allProposals, timestamp: now });

      return allProposals;
    } catch (error) {
      console.error("Error fetching proposals from blockchain:", error);
      // Return empty array instead of mock data
      return [];
    } finally {
      // Remove from in-flight requests
      inFlightRequests.delete(realmAddress);
    }
  })();

  // Store the in-flight request
  inFlightRequests.set(realmAddress, fetchPromise);

  return fetchPromise;
}

/**
 * Search for DAOs on Realms
 * Supports searching by realm address or fetching by address
 */
export async function searchRealmsDAOs(query: string): Promise<DAO[]> {
  const trimmedQuery = query.trim();
  
  // Validate we're in a browser environment
  if (typeof window === "undefined") {
    console.warn("searchRealmsDAOs can only be called in browser environment");
    return [];
  }
  
  // If query looks like a Solana address, try to fetch it directly
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmedQuery)) {
    try {
      const dao = await fetchDAOInfo(trimmedQuery);
      if (dao && dao.address) {
        return [dao];
      }
      return [];
    } catch (error: any) {
      console.error("Error fetching DAO by address:", error);
      // Return empty array instead of throwing
      return [];
    }
  }

  // Try to extract address from Realms URL
  const urlMatch = trimmedQuery.match(/realms\.today\/dao\/([A-Za-z0-9]{32,44})/);
  if (urlMatch && urlMatch[1]) {
    try {
      const dao = await fetchDAOInfo(urlMatch[1]);
      if (dao && dao.address) {
        return [dao];
      }
      return [];
    } catch (error: any) {
      console.error("Error fetching DAO from URL:", error);
      return [];
    }
  }

  // For text search, we can't easily search Realms without an API
  // So we'll return empty and let users search by address
  // In the future, we could maintain a local index or use a different approach
  return [];
}

/**
 * Get DAO from Realms by address or URL
 */
export async function getDAOFromRealms(identifier: string): Promise<DAO | null> {
  try {
    // Validate we're in a browser environment
    if (typeof window === "undefined") {
      console.warn("getDAOFromRealms can only be called in browser environment");
      return null;
    }

    // Extract address from URL if provided
    let address = identifier;
    const urlMatch = identifier.match(/realms\.today\/dao\/([A-Za-z0-9]{32,44})/);
    if (urlMatch && urlMatch[1]) {
      address = urlMatch[1];
    }

    // Validate it's a Solana address
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
      console.error("Invalid Solana address format:", address);
      return null;
    }

    // Fetch from blockchain (same as AdrenaDAO)
    const dao = await fetchDAOInfo(address);
    if (dao && dao.address) {
      return dao;
    }
    return null;
  } catch (error: any) {
    console.error("Error getting DAO from Realms:", error);
    // Return null instead of throwing to prevent breaking the UI
    return null;
  }
}

/**
 * Get popular Solana DAOs
 */
export const POPULAR_SOLANA_DAOS = APP_CONFIG.solanaDAOs.popularDAOs;

/**
 * Get realm address from a governance account
 * Fetches the governance account and extracts the realm address
 */
export async function getRealmFromGovernance(
  governanceAddress: string,
  network: "mainnet" | "devnet" = "mainnet"
): Promise<string | null> {
  try {
    const connection = getConnection(network);
    const governancePubkey = new PublicKey(governanceAddress);
    const governanceProgramId = GOVERNANCE_PROGRAM_ID;
    
    console.log(`Fetching governance account ${governanceAddress}...`);
    
    // First, verify the account exists
    const accountInfo = await connection.getAccountInfo(governancePubkey);
    
    if (!accountInfo) {
      console.warn(`❌ Governance account ${governanceAddress} not found on-chain`);
      return null;
    }
    
    // Check if the account belongs to the governance program
    if (!accountInfo.owner.equals(governanceProgramId)) {
      console.warn(`❌ Account ${governanceAddress} does not belong to governance program ${governanceProgramId.toBase58()}`);
      console.warn(`   Account owner: ${accountInfo.owner.toBase58()}`);
      console.warn(`   Expected owner: ${governanceProgramId.toBase58()}`);
      console.warn(`   This address is not a valid governance account. Please verify the address is correct.`);
      return null;
    }
    
    console.log(`✅ Governance account found, deserializing...`);
    
    // Use getGovernanceAccounts to fetch and deserialize the account
    // This is the proper way to deserialize governance accounts using the SDK
    try {
      const governanceAccounts = await getGovernanceAccounts(
        connection,
        governanceProgramId,
        Governance
      );
      
      console.log(`Fetched ${governanceAccounts.length} governance accounts, searching for ${governanceAddress}...`);
      
      const govAccount = governanceAccounts.find(
        (acc) => acc.pubkey.equals(governancePubkey)
      );
      
      if (!govAccount) {
        console.warn(`❌ Governance account ${governanceAddress} not found in fetched accounts`);
        console.log(`First few governance accounts:`, governanceAccounts.slice(0, 3).map(acc => acc.pubkey.toBase58()));
        return null;
      }
      
      console.log(`✅ Found governance account, extracting realm...`);
      
      const governance = govAccount.account as Governance;
      const realm = (governance as any).realm;
      
      if (!realm) {
        console.warn(`❌ Governance account ${governanceAddress} has no realm field`);
        console.log(`Governance account keys:`, Object.keys(governance).slice(0, 20));
        return null;
      }
      
      const realmPubkey = realm instanceof PublicKey 
        ? realm 
        : typeof realm === 'string'
        ? new PublicKey(realm)
        : new PublicKey(realm.toBase58?.() || realm.toString());
      
      const realmAddress = realmPubkey.toBase58();
      console.log(`✅ Found realm address: ${realmAddress}`);
      
      return realmAddress;
    } catch (error) {
      console.error(`❌ Error processing governance account ${governanceAddress}:`, error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error fetching realm from governance ${governanceAddress}:`, error);
    return null;
  }
}

/**
 * Register a dynamically added DAO (for DAOs added via the UI)
 */
export function registerDynamicDAO(address: string, data: { governanceAddresses?: string[]; network?: "mainnet" | "devnet" }) {
  dynamicDAOs.set(address, data);
  console.log(`Registered dynamic DAO ${address} with governance addresses:`, data.governanceAddresses);
}
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

