"use client";

import { useState, useEffect, useMemo } from "react";
import { ProposalCard } from "./ProposalCard";
import type { Proposal, AIAgent } from "@/types/dao";
import { useAgentServiceContext } from "@/contexts/AgentServiceContext";
import { FileText, AlertCircle, Clock, History } from "lucide-react";

export function ProposalList({
  daoAddress,
  daoNetwork,
  governingTokenMint,
  agent,
  onProposalsLoaded,
}: {
  daoAddress: string;
  daoNetwork?: "mainnet" | "devnet";
  governingTokenMint?: string;
  agent?: AIAgent;
  onProposalsLoaded?: (count: number) => void;
}) {
  const agentService = useAgentServiceContext();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, any>>({});
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [showPastProposals, setShowPastProposals] = useState(false);

  useEffect(() => {
    const loadProposals = async () => {
      setLoading(true);
      setError(null);
      try {
        const { fetchProposals } = await import("@/lib/realms");
        const fetchedProposals = await fetchProposals(daoAddress);
        setProposals(fetchedProposals);
        // Count only active proposals by default
        const activeCount = fetchedProposals.filter(p => 
          p.status === "draft" || p.status === "voting"
        ).length;
        onProposalsLoaded?.(activeCount);
      } catch (err) {
        console.error("Error loading proposals:", err);
        setError("Failed to load proposals. Please try again.");
        setProposals([]);
        onProposalsLoaded?.(0);
      } finally {
        setLoading(false);
      }
    };

    loadProposals();
  }, [daoAddress, onProposalsLoaded]);

  // Filter proposals based on active/past toggle
  const filteredProposals = useMemo(() => {
    if (showPastProposals) {
      // Show past proposals: succeeded, defeated, executed, cancelled
      return proposals.filter(p => 
        p.status === "succeeded" || 
        p.status === "defeated" || 
        p.status === "executed" || 
        p.status === "cancelled"
      );
    } else {
      // Show active proposals: draft, voting
      return proposals.filter(p => 
        p.status === "draft" || p.status === "voting"
      );
    }
  }, [proposals, showPastProposals]);

  const handleAnalyze = async (proposal: Proposal, agent: AIAgent) => {
    if (!agentService) {
      alert("Agent service not available. Please refresh the page.");
      return;
    }

    const agentInstance = agentService.getAgent(agent.id);
    if (!agentInstance) {
      alert("Please initialize the AI agent first. Click 'Initialize AI Agent' and enter your OpenAI API key.");
      return;
    }

    setAnalyzingId(proposal.id);

    try {
      const analysis = await agentService.analyzeProposalWithAgent(
        agent.id,
        proposal,
        agent
      );

      if (analysis) {
        setAnalyses((prev) => ({
          ...prev,
          [proposal.id]: analysis,
        }));
      }
    } catch (err) {
      console.error("Error analyzing proposal:", err);
      alert("Error analyzing proposal. Please check your OpenAI API key.");
    } finally {
      setAnalyzingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-slate-400 text-sm">Loading proposals...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="p-8 bg-slate-800/50 border border-slate-700 rounded-lg text-center">
        <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <p className="text-slate-400 font-medium">No proposals found</p>
        <p className="text-slate-500 text-sm mt-1">
          This DAO does not have any proposals yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          {showPastProposals ? "Past Proposals" : "Active Proposals"}
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">
            {filteredProposals.length} {showPastProposals ? "past" : "active"} proposal{filteredProposals.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setShowPastProposals(!showPastProposals)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20 text-sm font-semibold"
          >
            {showPastProposals ? (
              <>
                <Clock className="w-4 h-4" />
                View Active Proposals
              </>
            ) : (
              <>
                <History className="w-4 h-4" />
                View Past Proposals
              </>
            )}
          </button>
        </div>
      </div>
      
      {filteredProposals.length === 0 ? (
        <div className="p-8 bg-slate-800/50 border border-slate-700 rounded-lg text-center">
          <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">
            No {showPastProposals ? "past" : "active"} proposals found
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {showPastProposals 
              ? "There are no past proposals for this DAO"
              : "There are no active proposals for this DAO"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposal={proposal}
              agent={agent}
              onAnalyze={handleAnalyze}
              analysis={analyses[proposal.id]}
              isAnalyzing={analyzingId === proposal.id}
              daoAddress={daoAddress}
              daoNetwork={daoNetwork}
              governingTokenMint={governingTokenMint}
            />
          ))}
        </div>
      )}
    </div>
  );
}
