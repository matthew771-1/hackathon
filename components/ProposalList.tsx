"use client";

import { useState, useEffect } from "react";
import { ProposalCard } from "./ProposalCard";
import type { Proposal, AIAgent } from "@/types/dao";
import { useAgentServiceContext } from "@/contexts/AgentServiceContext";
import { FileText, AlertCircle } from "lucide-react";

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

  useEffect(() => {
    const loadProposals = async () => {
      setLoading(true);
      setError(null);
      try {
        const { fetchProposals } = await import("@/lib/realms");
        const fetchedProposals = await fetchProposals(daoAddress);
        setProposals(fetchedProposals);
        onProposalsLoaded?.(fetchedProposals.length);
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-400" />
          Proposals
        </h2>
        <span className="text-sm text-slate-400">
          {proposals.length} proposal{proposals.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="space-y-4">
        {proposals.map((proposal) => (
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
    </div>
  );
}
