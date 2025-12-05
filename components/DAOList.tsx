"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import type { DAO, AIAgent, Proposal, ScheduledVote, ProposalAnalysis } from "@/types/dao";
import { POPULAR_SOLANA_DAOS, fetchDAOInfo, fetchProposals } from "@/lib/realms";
import { DAODetail } from "./DAODetail";
import { ScheduledVotesPanel } from "./ScheduledVotesPanel";
import { ProposalList } from "./ProposalList";
import { AIAgentPanel } from "./AIAgentPanel";
import { DelegationConfirmModal } from "./DelegationConfirmModal";
import { useAgentServiceContext } from "@/contexts/AgentServiceContext";
import { useWalletContext } from "./WalletProvider";
import { Building2, FileText, ExternalLink, Plus, ChevronDown, Bot, Zap, RefreshCw, Search, Loader2, Shield, AlertTriangle } from "lucide-react";
import { AddDAOModal } from "./AddDAOModal";

const STORAGE_KEY = "dao-ai-agent-custom-daos";
const DELEGATIONS_KEY = "dao-ai-agent-delegations";
const SCHEDULED_VOTES_KEY = "dao-ai-agent-scheduled-votes";

// Helper functions for localStorage
const saveCustomDAOs = (daos: DAO[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(daos));
    } catch (error) {
      console.error("Error saving custom DAOs to localStorage:", error);
    }
  }
};

const loadCustomDAOs = async (): Promise<DAO[]> => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const daos = JSON.parse(stored) as DAO[];
        
        // Re-register dynamic DAOs with their governance addresses
        const { registerDynamicDAO } = await import("@/lib/realms");
        for (const dao of daos) {
          if (dao.governanceAddresses && dao.governanceAddresses.length > 0) {
            registerDynamicDAO(dao.address, {
              governanceAddresses: dao.governanceAddresses,
              network: dao.network || "mainnet",
            });
          }
        }
        
        return daos;
      }
    } catch (error) {
      console.error("Error loading custom DAOs from localStorage:", error);
    }
  }
  return [];
};

interface DelegationMap {
  [daoAddress: string]: string; // maps DAO address to agent ID
}

export function DAOList({ agents = [] }: { agents?: AIAgent[] }) {
  const agentService = useAgentServiceContext();
  const { isConnected, publicKey } = useWalletContext();
  const [daos, setDaos] = useState<DAO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDAO, setSelectedDAO] = useState<DAO | null>(null);
  
  // Helper to select a DAO and ensure tokenMint is populated
  const selectDAO = async (dao: DAO) => {
    // If tokenMint is missing, fetch fresh DAO info to get it
    if (!dao.tokenMint) {
      console.log(`Fetching tokenMint for ${dao.name}...`);
      try {
        const fullDAO = await fetchDAOInfo(dao.address);
        if (fullDAO.tokenMint) {
          const updatedDAO = { ...dao, tokenMint: fullDAO.tokenMint };
          // Update the DAO in the list too
          setDaos(prev => prev.map(d => d.address === dao.address ? updatedDAO : d));
          setSelectedDAO(updatedDAO);
          console.log(`Got tokenMint for ${dao.name}: ${fullDAO.tokenMint}`);
          return;
        }
      } catch (error) {
        console.error(`Failed to fetch tokenMint for ${dao.name}:`, error);
      }
    }
    setSelectedDAO(dao);
  };
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);
  const [pendingDelegationAgentId, setPendingDelegationAgentId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [delegations, setDelegations] = useState<DelegationMap>({});
  const [scheduledVotes, setScheduledVotes] = useState<ScheduledVote[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, ProposalAnalysis>>({});
  const [autoAnalyzing, setAutoAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DAO[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  // Ref to store selected DAO address for stable callback
  const selectedDAOAddressRef = useRef<string | null>(null);

  useEffect(() => {
    // Load popular Solana DAOs and custom DAOs
    const loadDAOs = async () => {
      setLoading(true);
      try {
        // Load custom DAOs from localStorage (and register their governance addresses)
        const customDAOs = await loadCustomDAOs();
        const customDAOAddresses = new Set(customDAOs.map(dao => dao.address));
        
        // Fetch DAO info for each popular Solana DAO (only if not already in custom DAOs)
        const popularDAOsToFetch = POPULAR_SOLANA_DAOS.filter(
          dao => !customDAOAddresses.has(dao.address)
        );
        
        const daoPromises = popularDAOsToFetch.map((dao) => 
          fetchDAOInfo(dao.address).catch((error) => {
            console.error(`Error fetching ${dao.name}:`, error);
            // Return fallback DAO data if fetch fails
            return {
              name: dao.name,
              address: dao.address,
              realm: dao.address,
              treasury: 0,
              memberCount: 0,
              proposalCount: 0,
              description: dao.description,
              website: dao.website,
              token: dao.token,
              network: dao.network,
              image: dao.image,
            } as DAO;
          })
        );
        const fetchedDAOs = await Promise.all(daoPromises);
        
        // Merge custom DAOs with fetched popular DAOs
        const allDAOs = [...customDAOs, ...fetchedDAOs];
        
        // Filter out nulls and remove duplicates by address
        const uniqueDAOs = allDAOs
          .filter((dao): dao is DAO => dao !== null)
          .filter((dao, index, self) => 
            index === self.findIndex((d) => d.address === dao.address)
          );
        setDaos(uniqueDAOs);
      } catch (error) {
        console.error("Error loading DAOs:", error);
        // Fallback: load custom DAOs and basic popular DAOs
        const customDAOs = await loadCustomDAOs();
        const fallbackDAOs: DAO[] = POPULAR_SOLANA_DAOS.map((dao) => ({
          name: dao.name,
          address: dao.address,
          realm: dao.address,
          treasury: 0,
          memberCount: 0,
          proposalCount: 0,
          description: dao.description,
          website: dao.website,
          token: dao.token,
          network: dao.network,
          image: dao.image,
        }));
        // Merge and remove duplicates
        const allDAOs = [...customDAOs, ...fallbackDAOs];
        const uniqueDAOs = allDAOs.filter((dao, index, self) => 
          index === self.findIndex((d) => d.address === dao.address)
        );
        setDaos(uniqueDAOs);
      } finally {
        setLoading(false);
      }
    };

    loadDAOs();
  }, []);

  // Load delegations and scheduled votes from storage
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

  // Save delegations
  const saveDelegations = useCallback((newDelegations: DelegationMap) => {
    localStorage.setItem(DELEGATIONS_KEY, JSON.stringify(newDelegations));
    setDelegations(newDelegations);
  }, []);

  // Save scheduled votes
  const saveScheduledVotes = useCallback((votes: ScheduledVote[]) => {
    localStorage.setItem(SCHEDULED_VOTES_KEY, JSON.stringify(votes));
    setScheduledVotes(votes);
  }, []);

  // Get delegated agent for selected DAO
  const getDelegatedAgent = useCallback((): AIAgent | null => {
    if (!selectedDAO) return null;
    const agentId = delegations[selectedDAO.address];
    return agents.find(a => a.id === agentId) || null;
  }, [selectedDAO, delegations, agents]);

  // Auto-analyze proposals when agent with autoVote is delegated
  useEffect(() => {
    const agent = getDelegatedAgent();
    if (!agent || !selectedDAO || !agentService || !proposals.length || autoAnalyzing) {
      return;
    }

    // Only auto-analyze if agent has autoVote enabled
    if (!agent.votingPreferences.autoVote) {
      return;
    }

    const agentInstance = agentService.getAgent(agent.id);
    if (!agentInstance) {
      return; // Agent not initialized yet
    }

    // Find active proposals that haven't been analyzed yet
    const activeProposals = proposals.filter(
      p => (p.status === "voting" || p.status === "draft") && !analyses[p.id]
    );

    if (activeProposals.length === 0) {
      return;
    }

    // Automatically analyze proposals with rate limiting
    const autoAnalyze = async () => {
      setAutoAnalyzing(true);

      // Only analyze first 3 proposals to avoid rate limits
      const proposalsToAnalyze = activeProposals.slice(0, 3);

      for (let i = 0; i < proposalsToAnalyze.length; i++) {
        const proposal = proposalsToAnalyze[i];
        
        // Add delay between requests to avoid rate limits (except for first request)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
        
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

            // Schedule vote if auto-vote enabled and confidence threshold met
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
        } catch (error: any) {
          console.error(`Error analyzing proposal ${proposal.id}:`, error);
          // Stop on rate limit errors
          if (error?.message?.includes("rate limit")) {
            console.warn("Rate limit hit, stopping auto-analysis. Will retry later.");
            break;
          }
        }
      }

      setAutoAnalyzing(false);
    };

    // Small delay to avoid multiple triggers
    const timeoutId = setTimeout(autoAnalyze, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposals.length, selectedDAO?.address, delegations, agents]);

  // Auto-analyze proposals (manual trigger)
  const runAutoAnalysis = useCallback(async () => {
    const agent = getDelegatedAgent();
    if (!agent || !selectedDAO || !agentService) return;

    const agentInstance = agentService.getAgent(agent.id);
    if (!agentInstance) {
      alert("Please initialize the AI agent first.");
      return;
    }

    const activeProposals = proposals.filter(
      p => (p.status === "voting" || p.status === "draft") && !analyses[p.id]
    );

    if (activeProposals.length === 0) {
      alert("No proposals to analyze.");
      return;
    }

    setAutoAnalyzing(true);

    for (let i = 0; i < activeProposals.length; i++) {
      const proposal = activeProposals[i];
      
      // Add delay between requests to avoid rate limits (except for first request)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
      
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

          // Schedule vote if auto-vote enabled
          if (agent.votingPreferences.autoVote) {
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

              const existing = scheduledVotes.find(v => v.proposalId === proposal.id && v.status === "pending");
              if (!existing) {
                saveScheduledVotes([...scheduledVotes, newVote]);
              }
            }
          }
        }
      } catch (error: any) {
        console.error(`Error analyzing proposal ${proposal.id}:`, error);
        // Stop on rate limit errors
        if (error?.message?.includes("rate limit")) {
          alert("OpenAI rate limit reached. Please wait a moment and try again.");
          break;
        }
      }
    }

    setAutoAnalyzing(false);
  }, [getDelegatedAgent, selectedDAO, agentService, proposals, analyses, scheduledVotes]);

  // Memoized callback to update proposal count when proposals are loaded
  const handleProposalsLoaded = useCallback((count: number) => {
    const daoAddress = selectedDAOAddressRef.current;
    if (!daoAddress) return;
    
    // Update DAO proposal count in the list only
    // Don't update selectedDAO to avoid infinite loop
    setDaos((prev) => 
      prev.map((dao) => 
        dao.address === daoAddress 
          ? { ...dao, proposalCount: count }
          : dao
      )
    );
  }, []); // Empty deps - uses ref to get current address

  // Handle agent delegation - show confirmation modal first
  const handleDelegateAgent = (agentId: string) => {
    if (!selectedDAO) return;
    
    // If removing delegation, do it directly
    if (!agentId) {
      const newDelegations = { ...delegations };
      delete newDelegations[selectedDAO.address];
      saveDelegations(newDelegations);
      return;
    }
    
    // Show delegation confirmation modal
    setPendingDelegationAgentId(agentId);
    setIsDelegationModalOpen(true);
  };

  // Confirm delegation
  const confirmDelegation = () => {
    if (!selectedDAO || !pendingDelegationAgentId) return;
    const newDelegations = { ...delegations, [selectedDAO.address]: pendingDelegationAgentId };
    saveDelegations(newDelegations);
    setIsDelegationModalOpen(false);
    setPendingDelegationAgentId(null);
  };

  // Handle canceling a scheduled vote
  const handleCancelVote = (voteId: string) => {
    const updated = scheduledVotes.map(v =>
      v.id === voteId ? { ...v, status: "cancelled" as const } : v
    );
    saveScheduledVotes(updated);
  };

  // Handle vote execution
  const handleExecuteVote = (voteId: string, signature: string) => {
    const updated = scheduledVotes.map(v =>
      v.id === voteId ? { ...v, status: "executed" as const } : v
    );
    saveScheduledVotes(updated);
    console.log(`Vote ${voteId} executed with signature: ${signature}`);
  };

  // Handle search
  const handleSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    
    // Allow searching even for short queries if it looks like an address
    const isAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmedQuery);
    const isURL = trimmedQuery.includes("realms.today");
    
    if (!isAddress && !isURL && trimmedQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Dynamically import to ensure it's available
      const { searchRealmsDAOs } = await import("@/lib/realms");
      const results = await searchRealmsDAOs(trimmedQuery);
      setSearchResults(results || []);
    } catch (error: any) {
      console.error("Error searching DAOs:", error);
      setSearchResults([]);
      // Show user-friendly error
      if (error?.message) {
        console.error("Search error details:", error.message);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Handle manual analysis
  const handleAnalyze = async (proposal: Proposal, agent: AIAgent) => {
    if (!agentService) return;
    
    const agentInstance = agentService.getAgent(agent.id);
    if (!agentInstance) {
      alert("Please initialize the AI agent first.");
      return;
    }

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
      }
    } catch (error) {
      console.error("Error analyzing proposal:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-purple-600"></div>
      </div>
    );
  }

  const handleAddDAO = async (daoData: Omit<DAO, "treasury" | "memberCount" | "proposalCount">) => {
    const { getRealmFromGovernance, registerDynamicDAO, fetchDAOInfo } = await import("@/lib/realms");
    
    // If realm address is provided directly, use it
    let realmAddress: string | null = daoData.address || daoData.realm || null;
    
    // If no realm address provided, try to get it from governance addresses
    if (!realmAddress) {
      if (!daoData.governanceAddresses || daoData.governanceAddresses.length === 0) {
        alert("Please provide either a realm address or at least one governance address.");
        return;
      }
      
      // Try each governance address until we find a valid one
      const network = daoData.network || "mainnet";
      
      for (const govAddress of daoData.governanceAddresses) {
        console.log(`Trying governance address: ${govAddress}`);
        realmAddress = await getRealmFromGovernance(govAddress, network);
        if (realmAddress) {
          console.log(`✅ Found realm address ${realmAddress} from governance ${govAddress}`);
          break;
        }
      }
      
      if (!realmAddress) {
        alert(`Could not find realm address from any of the provided governance accounts. Please verify the governance addresses are correct and belong to the SPL Governance program, or provide the realm address directly.`);
        return;
      }
    } else {
      console.log(`Using provided realm address: ${realmAddress}`);
    }
    
    // Check if DAO already exists to prevent duplicates
    const existingDAO = daos.find(dao => dao.address === realmAddress);
    if (existingDAO) {
      alert(`This DAO (${existingDAO.name}) is already in the list.`);
      return;
    }
    
    // Register the DAO with the actual realm address
    registerDynamicDAO(realmAddress, {
      governanceAddresses: daoData.governanceAddresses,
      network: daoData.network,
    });
    
    // Fetch the DAO info using the actual realm address
    try {
      const fullDAO = await fetchDAOInfo(realmAddress);
      // Preserve governance addresses from form data
      const daoWithGovernance: DAO = {
        ...fullDAO,
        address: realmAddress, // Use the actual realm address
        realm: realmAddress,
        governanceAddresses: daoData.governanceAddresses,
      };
      setDaos((prev) => {
        const updated = [...prev, daoWithGovernance];
        // Save custom DAOs to localStorage (exclude popular DAOs)
        const popularDAOAddresses = new Set<string>(POPULAR_SOLANA_DAOS.map(d => d.address));
        const customDAOs = updated.filter(dao => !popularDAOAddresses.has(dao.address));
        saveCustomDAOs(customDAOs);
        return updated;
      });
    } catch (error) {
      console.error("Error fetching new DAO info:", error);
      // Add with default values if fetch fails
      const newDAO: DAO = {
        ...daoData,
        address: realmAddress, // Use the actual realm address
        realm: realmAddress,
        treasury: 0,
        memberCount: 0,
        proposalCount: 0,
      };
      setDaos((prev) => {
        const updated = [...prev, newDAO];
        // Save custom DAOs to localStorage (exclude popular DAOs)
        const popularDAOAddresses = new Set<string>(POPULAR_SOLANA_DAOS.map(d => d.address));
        const customDAOs = updated.filter(dao => !popularDAOAddresses.has(dao.address));
        saveCustomDAOs(customDAOs);
        return updated;
      });
    }
  };

  // Get the delegated agent for the selected DAO
  const delegatedAgent = getDelegatedAgent();
  const pendingVotes = scheduledVotes.filter(
    v => v.status === "pending" && (!selectedDAO || v.daoAddress === selectedDAO.address)
  );

  return (
    <div className="space-y-6">
      {/* DAO Dropdown Selector */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">
                Select Your DAO
              </label>
              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (!showSearch) {
                    setIsDropdownOpen(false);
                  }
                }}
                className="p-2 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                title="Search DAOs from Realms"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              {/* Search Input */}
              {showSearch && (
                <div className="mb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                        onChange={(e) => {
                        setSearchQuery(e.target.value);
                        const value = e.target.value.trim();
                        // Search if it looks like an address or URL, or if it's long enough
                        if (value.length > 0 && (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value) || value.includes("realms.today") || value.length > 10)) {
                          handleSearch(value);
                        } else {
                          setSearchResults([]);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && searchQuery.trim().length > 0) {
                          handleSearch(searchQuery.trim());
                        }
                      }}
                      placeholder="Enter Realms DAO address or URL (e.g., GWe1VYTRMujAtGVhSLwSn4YPsXBLe5qfkzNAYAKD44Nk)"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-400 animate-spin" />
                    )}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
                      {searchResults.map((dao) => (
                        <button
                          key={dao.address}
                          onClick={async () => {
                            // Fetch full DAO info and add to list
                            try {
                              const { getDAOFromRealms } = await import("@/lib/realms");
                              const fullDAO = await getDAOFromRealms(dao.address);
                              if (fullDAO) {
                                // Check if already exists
                                const exists = daos.find(d => d.address === fullDAO.address);
                                if (!exists) {
                                  setDaos(prev => [...prev, fullDAO]);
                                  // Save to custom DAOs
                                  const popularAddresses = new Set<string>(POPULAR_SOLANA_DAOS.map(d => d.address));
                                  const customDAOs = [...daos, fullDAO].filter(d => !popularAddresses.has(d.address));
                                  localStorage.setItem(STORAGE_KEY, JSON.stringify(customDAOs));
                                }
                                selectDAO(fullDAO);
                                setShowSearch(false);
                                setSearchQuery("");
                                setSearchResults([]);
                              } else {
                                alert("Failed to fetch DAO information. Please verify the address is correct.");
                              }
                            } catch (error: any) {
                              console.error("Error adding DAO:", error);
                              alert(`Failed to add DAO: ${error?.message || "Unknown error"}. Please try again.`);
                            }
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left border-b border-slate-700/50 last:border-b-0"
                        >
                          {dao.image && (
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center border border-slate-700">
                              <Image
                                src={dao.image}
                                alt={dao.name}
                                width={32}
                                height={32}
                                className="object-contain"
                                unoptimized
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-white truncate">{dao.name}</div>
                            {dao.description && (
                              <div className="text-xs text-slate-400 truncate">{dao.description}</div>
                            )}
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{dao.address.slice(0, 8)}...</div>
                          </div>
                          <Plus className="w-4 h-4 text-purple-400" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-left hover:border-purple-500/50 transition-all"
              >
                {selectedDAO ? (
                  <div className="flex items-center gap-3">
                    {selectedDAO.image && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center border border-slate-600">
                        <Image
                          src={selectedDAO.image}
                          alt={selectedDAO.name}
                          width={32}
                          height={32}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-white">{selectedDAO.name}</span>
                      {selectedDAO.token && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full">
                          {selectedDAO.token}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400">Choose a DAO...</span>
                )}
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute z-50 mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    {daos.map((dao) => (
                      <button
                        key={dao.address}
                        onClick={() => {
                          selectDAO(dao);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors text-left ${
                          selectedDAO?.address === dao.address ? "bg-purple-500/10 border-l-2 border-purple-500" : ""
                        }`}
                      >
                        {dao.image && (
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center border border-slate-700">
                            <Image
                              src={dao.image}
                              alt={dao.name}
                              width={32}
                              height={32}
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">{dao.name}</div>
                          {dao.description && (
                            <div className="text-xs text-slate-400 truncate">{dao.description}</div>
                          )}
                        </div>
                        {delegations[dao.address] && (
                          <Bot className="w-4 h-4 text-green-400" />
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsAddModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 border-t border-slate-700 text-purple-400 hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add New DAO
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Agent Delegation */}
          {selectedDAO && (
            <div className="lg:w-80">
              <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
                Delegated AI Agent
              </label>
              {agents.length > 0 ? (
                <div className="flex gap-2">
                  <select
                    value={delegatedAgent?.id || ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        handleDelegateAgent(e.target.value);
                      } else {
                        const newDelegations = { ...delegations };
                        delete newDelegations[selectedDAO.address];
                        saveDelegations(newDelegations);
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  >
                    <option value="" className="bg-slate-900">No agent delegated</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id} className="bg-slate-900">
                        {agent.name} ({agent.votingPreferences.riskTolerance})
                      </option>
                    ))}
                  </select>
                  {delegatedAgent && (
                    <button
                      onClick={runAutoAnalysis}
                      disabled={autoAnalyzing}
                      className="px-4 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl hover:from-purple-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Run AI analysis on all active proposals"
                    >
                      {autoAnalyzing ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Zap className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm">
                  Create an agent first in &quot;My Agents&quot; tab
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delegation Status */}
        {delegatedAgent && selectedDAO && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-green-400">{delegatedAgent.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full">
                    Active
                  </span>
                  {delegatedAgent.votingPreferences.autoVote && (
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Auto-Vote Enabled
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-0.5">
                  {delegatedAgent.votingPreferences.riskTolerance} risk • 
                  Min confidence: {delegatedAgent.votingPreferences.minVotingThreshold || 70}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Old Grid View - Keep for reference but hide when DAO selected */}
      {!selectedDAO && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              Available DAOs
            </h2>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
            >
              <Plus className="w-4 h-4" />
              Add DAO
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {daos.map((dao) => (
          <div
            key={dao.address}
            className="p-6 border border-slate-800 rounded-xl hover:border-purple-500/50 transition-all bg-slate-900/50 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                {dao.image && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
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
                <h3 className="text-xl font-semibold text-white">{dao.name}</h3>
              </div>
              <Building2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
            </div>
            {dao.description && (
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">{dao.description}</p>
            )}
            {dao.token && (
              <div className="mb-4">
                <span className="text-xs px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  {dao.token}
                </span>
              </div>
            )}
            <div className="space-y-2.5 text-sm mb-4 p-3 bg-slate-950/50 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Proposals:
                </span>
                <span className="font-medium text-slate-300">{dao.proposalCount}</span>
              </div>
            </div>
            <button
              onClick={() => selectDAO(dao)}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
            >
              <ExternalLink className="w-4 h-4" />
              View DAO
            </button>
          </div>
        ))}
          </div>
        </>
      )}

      {/* Selected DAO View */}
      {selectedDAO && (
        <div className="space-y-6">
          {/* Wallet Connection Prompt */}
          {!isConnected && (
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-400 text-lg mb-1">Wallet Not Connected</h3>
                  <p className="text-slate-400 text-sm mb-3">
                    Connect your wallet to vote on proposals and delegate to AI agents. 
                    Your wallet is needed to sign voting transactions on the Solana blockchain.
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Shield className="w-4 h-4" />
                    <span>Your tokens remain in your wallet - we only request permission to vote</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Agent Panel - Show when agent is delegated */}
          {delegatedAgent && (
            <AIAgentPanel
              agent={delegatedAgent}
              dao={selectedDAO}
              scheduledVotes={scheduledVotes}
              onCancelVote={handleCancelVote}
              onExecuteVote={handleExecuteVote}
            />
          )}

          {/* Proposals List */}
          <ProposalList
            daoAddress={selectedDAO.address}
            daoNetwork={selectedDAO.network}
            governingTokenMint={selectedDAO.tokenMint}
            agent={delegatedAgent || undefined}
            onProposalsLoaded={handleProposalsLoaded}
          />
        </div>
      )}

      <AddDAOModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddDAO}
      />

      {/* Delegation Confirmation Modal */}
      {isDelegationModalOpen && selectedDAO && pendingDelegationAgentId && (
        <DelegationConfirmModal
          agent={agents.find(a => a.id === pendingDelegationAgentId)!}
          dao={selectedDAO}
          onConfirm={confirmDelegation}
          onClose={() => {
            setIsDelegationModalOpen(false);
            setPendingDelegationAgentId(null);
          }}
        />
      )}
    </div>
  );
}

