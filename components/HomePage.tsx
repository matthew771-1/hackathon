"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { PublicKey, Connection } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { getTokenOwnerRecordsByOwner } from "@solana/spl-governance";
import type { DAO, AIAgent, ScheduledVote, Proposal, ProposalAnalysis } from "@/types/dao";
import { POPULAR_SOLANA_DAOS, fetchDAOInfo, fetchProposals } from "@/lib/realms";
import { getRpcUrl, APP_CONFIG } from "@/lib/config";
import { AIAgentPanel } from "./AIAgentPanel";
import { useAgentServiceContext } from "@/contexts/AgentServiceContext";
import { 
  Building2, 
  Bot, 
  Zap, 
  FileText, 
  TrendingUp,
  Activity,
  Wallet,
  Clock,
  CheckCircle2,
  X
} from "lucide-react";

const DELEGATIONS_KEY = "dao-ai-agent-delegations";
const SCHEDULED_VOTES_KEY = "dao-ai-agent-scheduled-votes";

interface DelegationMap {
  [daoAddress: string]: string; // maps DAO address to agent ID
}

interface TokenBalance {
  mint: string;
  amount: number;
  decimals: number;
}

interface HomePageProps {
  agents: AIAgent[];
}

export function HomePage({ agents }: HomePageProps) {
  const agentService = useAgentServiceContext();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [eligibleDAOs, setEligibleDAOs] = useState<DAO[]>([]);
  const [loading, setLoading] = useState(true);
  const [rpcError, setRpcError] = useState<string | null>(null);
  const [delegations, setDelegations] = useState<DelegationMap>({});
  const [scheduledVotes, setScheduledVotes] = useState<ScheduledVote[]>([]);
  const [selectedDAO, setSelectedDAO] = useState<DAO | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, ProposalAnalysis>>({});
  const [autoAnalyzing, setAutoAnalyzing] = useState(false);
  const selectedDAOAddressRef = useRef<string | null>(null);

  // Detect wallet connection
  useEffect(() => {
    const checkWallet = () => {
      if (typeof window === "undefined") return;
      
      const phantom = (window as any).solana;
      if (phantom?.isPhantom && phantom?.isConnected && phantom?.publicKey) {
        setWalletAddress(phantom.publicKey.toString());
        return;
      }
      
      const solflare = (window as any).solflare;
      if (solflare?.isSolflare && solflare?.isConnected && solflare?.publicKey) {
        setWalletAddress(solflare.publicKey.toString());
        return;
      }
      
      const backpack = (window as any).backpack;
      if (backpack?.isBackpack && backpack?.isConnected && backpack?.publicKey) {
        setWalletAddress(backpack.publicKey.toString());
        return;
      }
      
      setWalletAddress(null);
    };
    
    checkWallet();
    const interval = setInterval(checkWallet, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load delegations and scheduled votes
  useEffect(() => {
    const storedDelegations = localStorage.getItem(DELEGATIONS_KEY);
    if (storedDelegations) {
      setDelegations(JSON.parse(storedDelegations));
    }

    const storedVotes = localStorage.getItem(SCHEDULED_VOTES_KEY);
    if (storedVotes) {
      const votes = JSON.parse(storedVotes).map((v: any) => ({
        ...v,
        scheduledTime: new Date(v.scheduledTime),
      }));
      setScheduledVotes(votes);
    }
  }, []);

  // Fetch token balances and find eligible DAOs
  useEffect(() => {
    const fetchTokenBalances = async () => {
      if (!walletAddress) {
        setEligibleDAOs([]);
        setTokenBalances([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setRpcError(null);
      try {
        const walletPubkey = new PublicKey(walletAddress);
        const connection = new Connection(getRpcUrl("mainnet"), {
          commitment: "confirmed",
          confirmTransactionInitialTimeout: 30000,
        });
        const governanceProgramId = new PublicKey(APP_CONFIG.solanaDAOs.governanceProgramId);
        
        // Get all token accounts for the wallet
        let tokenAccounts;
        let hadRpcError = false;
        try {
          tokenAccounts = await connection.getParsedTokenAccountsByOwner(walletPubkey, {
            programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
          });
        } catch (error: any) {
          // Handle various RPC errors
          const errorMessage = error?.message || String(error);
          hadRpcError = true;
          if (errorMessage.includes("403") || error?.code === 403 || error?.error?.code === 403) {
            console.error("⚠️ RPC rate limit (403). Please set NEXT_PUBLIC_SOLANA_MAINNET_RPC in .env.local");
            setRpcError("RPC rate limit reached. Consider setting up a custom RPC endpoint.");
          } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("fetch")) {
            console.error("⚠️ Network error connecting to Solana RPC. The public RPC may be overloaded.");
            setRpcError("Network error connecting to Solana. The public RPC may be overloaded.");
          } else {
            console.error("⚠️ Error fetching token accounts:", errorMessage);
            setRpcError("Error connecting to Solana network.");
          }
          // Continue without token accounts - we'll still try to find DAOs via governance records
          tokenAccounts = { value: [] };
        }

        const balances: TokenBalance[] = [];
        const tokenMintMap = new Map<string, TokenBalance>();

        for (const account of tokenAccounts.value) {
          const parsedInfo = account.account.data.parsed.info;
          const mint = parsedInfo.mint;
          const amount = parsedInfo.tokenAmount.uiAmount || 0;
          const decimals = parsedInfo.tokenAmount.decimals;

          if (amount > 0) {
            const balance: TokenBalance = { mint, amount, decimals };
            balances.push(balance);
            tokenMintMap.set(mint, balance);
          }
        }

        setTokenBalances(balances);

        // Match tokens to DAOs (check both direct token ownership AND governance voting power)
        const daos: DAO[] = [];
        const checkedAddresses = new Set<string>();
        
        // Method 1: Check direct token ownership
        for (const daoConfig of POPULAR_SOLANA_DAOS) {
          if (daoConfig.tokenMint && tokenMintMap.has(daoConfig.tokenMint)) {
            try {
              const dao = await fetchDAOInfo(daoConfig.address);
              daos.push(dao);
              checkedAddresses.add(daoConfig.address);
            } catch (error) {
              console.error(`Error fetching DAO ${daoConfig.name}:`, error);
            }
          }
        }

        // Method 2: Check governance Token Owner Records (catches staked tokens)
        try {
          const tokenOwnerRecords = await getTokenOwnerRecordsByOwner(
            connection,
            governanceProgramId,
            walletPubkey
          );

          console.log(`Found ${tokenOwnerRecords.length} Token Owner Records for wallet`);

          for (const record of tokenOwnerRecords) {
            const realmAddress = record.account.realm.toBase58();
            
            // Skip if we already added this DAO
            if (checkedAddresses.has(realmAddress)) continue;

            // Check if this realm is in our popular DAOs
            const daoConfig = POPULAR_SOLANA_DAOS.find(d => d.address === realmAddress);
            
            // Check if user has voting power (deposited tokens)
            const depositedAmount = record.account.governingTokenDepositAmount;
            const hasVotingPower = depositedAmount && depositedAmount > BigInt(0);

            if (hasVotingPower) {
              console.log(`Found voting power in realm ${realmAddress}: ${depositedAmount.toString()}`);
              
              try {
                const dao = await fetchDAOInfo(realmAddress);
                
                // Add token balance info for staked tokens
                if (daoConfig?.tokenMint) {
                  const stakedBalance: TokenBalance = {
                    mint: daoConfig.tokenMint,
                    amount: Number(depositedAmount) / Math.pow(10, 6), // Assuming 6 decimals
                    decimals: 6,
                  };
                  
                  // Add to balances if not already there
                  if (!tokenMintMap.has(daoConfig.tokenMint)) {
                    balances.push(stakedBalance);
                    tokenMintMap.set(daoConfig.tokenMint, stakedBalance);
                  }
                }
                
                daos.push(dao);
                checkedAddresses.add(realmAddress);
              } catch (error) {
                console.error(`Error fetching DAO for realm ${realmAddress}:`, error);
              }
            }
          }
        } catch (error: any) {
          // Handle various RPC errors
          const errorMessage = error?.message || String(error);
          if (errorMessage.includes("403") || error?.code === 403 || error?.error?.code === 403) {
            console.error("⚠️ RPC rate limit (403) when fetching governance records. Please set NEXT_PUBLIC_SOLANA_MAINNET_RPC in .env.local");
          } else if (errorMessage.includes("Failed to fetch") || errorMessage.includes("fetch")) {
            console.error("⚠️ Network error connecting to Solana RPC when fetching governance records.");
          } else {
            console.error("Error fetching Token Owner Records:", error);
          }
        }

        setTokenBalances(balances);
        setEligibleDAOs(daos);
      } catch (error: any) {
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes("Failed to fetch") || errorMessage.includes("fetch")) {
          console.error("⚠️ Network error: Unable to connect to Solana RPC. The public endpoint may be overloaded.");
        } else {
          console.error("Error fetching token balances:", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTokenBalances();
  }, [walletAddress]);

  // Update ref when selectedDAO changes
  useEffect(() => {
    selectedDAOAddressRef.current = selectedDAO?.address || null;
  }, [selectedDAO?.address]);

  // Load proposals when DAO is selected
  useEffect(() => {
    if (!selectedDAO) {
      setProposals([]);
      return;
    }

    const loadProposals = async () => {
      try {
        const fetched = await fetchProposals(selectedDAO.address);
        setProposals(fetched);
      } catch (error) {
        console.error("Error loading proposals:", error);
        setProposals([]);
      }
    };

    loadProposals();
  }, [selectedDAO?.address]);

  // Get delegated agent for selected DAO
  const getDelegatedAgent = useCallback((daoAddress: string): AIAgent | null => {
    const agentId = delegations[daoAddress];
    return agents.find(a => a.id === agentId) || null;
  }, [delegations, agents]);

  // Save scheduled votes
  const saveScheduledVotes = useCallback((votes: ScheduledVote[]) => {
    localStorage.setItem(SCHEDULED_VOTES_KEY, JSON.stringify(votes));
    setScheduledVotes(votes);
  }, []);

  // Auto-analyze proposals when agent with autoVote is delegated
  useEffect(() => {
    if (!selectedDAO) return;
    
    const agent = getDelegatedAgent(selectedDAO.address);
    if (!agent || !agentService || !proposals.length || autoAnalyzing) {
      return;
    }

    if (!agent.votingPreferences.autoVote) {
      return;
    }

    const agentInstance = agentService.getAgent(agent.id);
    if (!agentInstance) {
      return;
    }

    const activeProposals = proposals.filter(
      p => (p.status === "voting" || p.status === "draft") && !analyses[p.id]
    );

    if (activeProposals.length === 0) {
      return;
    }

    const autoAnalyze = async () => {
      setAutoAnalyzing(true);

      for (const proposal of activeProposals) {
        try {
          const analysis = await agentService.analyzeProposalWithAgent(
            agent.id,
            proposal,
            agent
          );

          if (analysis) {
            const typedAnalysis: ProposalAnalysis = {
              recommendation: analysis.recommendation,
              reasoning: analysis.reasoning,
              confidence: analysis.confidence,
              keyFactors: analysis.keyFactors || [],
            };
            setAnalyses(prev => ({ ...prev, [proposal.id]: typedAnalysis }));

            const minConfidence = agent.votingPreferences.minVotingThreshold || 70;
            
            if (typedAnalysis.confidence >= minConfidence && typedAnalysis.recommendation !== "abstain") {
              const scheduledTime = new Date();
              scheduledTime.setMinutes(scheduledTime.getMinutes() + 2);

              const newVote: ScheduledVote = {
                id: `vote-${Date.now()}-${proposal.id}`,
                proposalId: proposal.id,
                proposalTitle: proposal.title,
                daoAddress: selectedDAO.address,
                daoName: selectedDAO.name,
                agentId: agent.id,
                agentName: agent.name,
                recommendation: typedAnalysis.recommendation as "yes" | "no",
                confidence: typedAnalysis.confidence,
                scheduledTime,
                status: "pending",
                reasoning: typedAnalysis.reasoning,
              };

              setScheduledVotes((prev) => {
                const existing = prev.find(v => v.proposalId === proposal.id && v.status === "pending");
                if (!existing) {
                  const updated = [...prev, newVote];
                  saveScheduledVotes(updated);
                  return updated;
                }
                return prev;
              });
            }
          }
        } catch (error) {
          console.error(`Error analyzing proposal ${proposal.id}:`, error);
        }
      }

      setAutoAnalyzing(false);
    };

    const timeoutId = setTimeout(autoAnalyze, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposals.length, selectedDAO?.address, delegations, agents]);

  // Handle canceling a scheduled vote
  const handleCancelVote = (voteId: string) => {
    const updated = scheduledVotes.map(v =>
      v.id === voteId ? { ...v, status: "cancelled" as const } : v
    );
    setScheduledVotes(updated);
    localStorage.setItem(SCHEDULED_VOTES_KEY, JSON.stringify(updated));
  };

  const totalScheduledVotes = scheduledVotes.filter(v => v.status === "pending").length;
  const activeAgents = agents.filter(agent => {
    return Object.values(delegations).includes(agent.id);
  }).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-900/30 to-slate-900 border border-purple-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{agents.length}</div>
              <div className="text-sm text-slate-400">AI Agents</div>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {activeAgents} active delegation{activeAgents !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/30 to-slate-900 border border-green-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{eligibleDAOs.length}</div>
              <div className="text-sm text-slate-400">Eligible DAOs</div>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Based on your token holdings
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-slate-900 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{totalScheduledVotes}</div>
              <div className="text-sm text-slate-400">Scheduled Votes</div>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Upcoming AI agent votes
          </div>
        </div>
      </div>

      {/* Wallet Connection Prompt */}
      {!walletAddress && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 text-center">
          <Wallet className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-slate-400 mb-4">
            Connect your wallet to see which DAOs you can vote on based on your token holdings.
          </p>
        </div>
      )}

      {/* AI Agents Section */}
      {agents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-purple-400" />
              Your AI Agents
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => {
              const isDelegated = Object.values(delegations).includes(agent.id);
              const delegatedDAOs = eligibleDAOs.filter(dao => delegations[dao.address] === agent.id);
              
              return (
                <div
                  key={agent.id}
                  className="p-5 border border-slate-800 rounded-xl hover:border-purple-500/50 transition-all bg-slate-900/50 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 flex items-center justify-center border border-purple-500/30">
                        <Bot className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{agent.name}</h3>
                        <p className="text-xs text-slate-400 capitalize">{agent.votingPreferences.riskTolerance}</p>
                      </div>
                    </div>
                    {isDelegated && (
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mb-3 line-clamp-2">{agent.personality}</p>
                  <div className="space-y-2 text-xs mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Auto Vote:</span>
                      <span className="font-medium text-slate-300">
                        {agent.votingPreferences.autoVote ? (
                          <span className="flex items-center gap-1 text-green-400">
                            <Zap className="w-3 h-3" />
                            Enabled
                          </span>
                        ) : (
                          "Disabled"
                        )}
                      </span>
                    </div>
                    {isDelegated && delegatedDAOs.length > 0 && (
                      <div className="text-slate-500">
                        Delegated to {delegatedDAOs.length} DAO{delegatedDAOs.length !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Eligible DAOs Section */}
      {walletAddress && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-400" />
              DAOs You Can Vote On
            </h2>
          </div>
          {eligibleDAOs.length === 0 ? (
            <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-xl text-center">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-1">No eligible DAOs found</p>
              <p className="text-sm text-slate-500 mb-3">
                {rpcError 
                  ? "Could not check your token balances due to network issues."
                  : "You don't currently hold governance tokens for any supported DAOs."}
              </p>
              {rpcError && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-left max-w-md mx-auto">
                  <p className="text-sm text-amber-400 font-medium mb-1">⚠️ RPC Connection Issue</p>
                  <p className="text-xs text-amber-300/80">{rpcError}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Tip: Set NEXT_PUBLIC_SOLANA_MAINNET_RPC in .env.local with a custom RPC endpoint from Helius, QuickNode, or Alchemy.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {eligibleDAOs.map((dao) => {
                const delegatedAgent = getDelegatedAgent(dao.address);
                const daoVotes = scheduledVotes.filter(
                  v => v.daoAddress === dao.address && v.status === "pending"
                );

                return (
                  <div
                    key={dao.address}
                    className="p-5 border border-slate-800 rounded-xl hover:border-green-500/50 transition-all bg-slate-900/50 backdrop-blur-sm cursor-pointer"
                    onClick={() => setSelectedDAO(dao)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        {dao.image && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center border border-slate-700 flex-shrink-0">
                            <Image
                              src={dao.image}
                              alt={dao.name}
                              width={40}
                              height={40}
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-white">{dao.name}</h3>
                          {dao.token && (
                            <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full">
                              {dao.token}
                            </span>
                          )}
                        </div>
                      </div>
                      {delegatedAgent && (
                        <Bot className="w-5 h-5 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="space-y-2 text-sm mb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Proposals:</span>
                        <span className="font-medium text-slate-300">{dao.proposalCount}</span>
                      </div>
                      {delegatedAgent && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Agent:</span>
                          <span className="font-medium text-purple-400">{delegatedAgent.name}</span>
                        </div>
                      )}
                      {daoVotes.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Scheduled:</span>
                          <span className="font-medium text-blue-400">{daoVotes.length} vote{daoVotes.length !== 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected DAO Detail View */}
      {selectedDAO && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {selectedDAO.image && (
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center border border-slate-700">
                    <Image
                      src={selectedDAO.image}
                      alt={selectedDAO.name}
                      width={64}
                      height={64}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedDAO.name}</h2>
                  {selectedDAO.token && (
                    <span className="text-sm px-3 py-1 bg-green-500/20 text-green-300 rounded-full">
                      {selectedDAO.token}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedDAO(null)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Agent Delegation */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Delegated AI Agent
              </label>
              {agents.length > 0 ? (
                <select
                  value={getDelegatedAgent(selectedDAO.address)?.id || ""}
                  onChange={(e) => {
                    const newDelegations = { ...delegations };
                    if (e.target.value) {
                      newDelegations[selectedDAO.address] = e.target.value;
                    } else {
                      delete newDelegations[selectedDAO.address];
                    }
                    setDelegations(newDelegations);
                    localStorage.setItem(DELEGATIONS_KEY, JSON.stringify(newDelegations));
                  }}
                  className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                >
                  <option value="" className="bg-slate-900">No agent delegated</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id} className="bg-slate-900">
                      {agent.name} ({agent.votingPreferences.riskTolerance})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm">
                  Create an agent first in &quot;My Agents&quot; tab
                </div>
              )}
            </div>

            {/* Delegation Status */}
            {getDelegatedAgent(selectedDAO.address) && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-green-400">
                        {getDelegatedAgent(selectedDAO.address)?.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full">
                        Active
                      </span>
                      {getDelegatedAgent(selectedDAO.address)?.votingPreferences.autoVote && (
                        <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Auto-Vote Enabled
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {getDelegatedAgent(selectedDAO.address)?.votingPreferences.riskTolerance} risk • 
                      Min confidence: {getDelegatedAgent(selectedDAO.address)?.votingPreferences.minVotingThreshold || 70}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Agent Panel */}
          {getDelegatedAgent(selectedDAO.address) && (
            <AIAgentPanel
              agent={getDelegatedAgent(selectedDAO.address)!}
              dao={selectedDAO}
              scheduledVotes={scheduledVotes}
              onCancelVote={handleCancelVote}
            />
          )}
        </div>
      )}
    </div>
  );
}