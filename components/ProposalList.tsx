"use client";

import { useState, useEffect } from "react";
import { ProposalCard } from "./ProposalCard";
import type { Proposal, AIAgent } from "@/types/dao";
import { useAgentService } from "@/hooks/useAgentService";

export function ProposalList({
  daoAddress,
  agent,
  agentService,
}: {
  daoAddress: string;
  agent?: AIAgent;
  agentService?: ReturnType<typeof useAgentService>;
}) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<Record<string, any>>({});
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  useEffect(() => {
    const loadProposals = async () => {
      setLoading(true);
      try {
        const { fetchProposals } = await import("@/lib/realms");
        const fetchedProposals = await fetchProposals(daoAddress);
        setProposals(fetchedProposals);
      } catch (error) {
        console.error("Error loading proposals:", error);
        // Fallback to empty array if fetch fails
        setProposals([]);
      } finally {
        setLoading(false);
      }
    };

    loadProposals();
  }, [daoAddress]);

  const handleAnalyze = async (proposal: Proposal, agent: AIAgent) => {
    if (!agentService || !agentService.isInitialized) {
      console.error("Agent service not initialized");
      alert("Please initialize the AI agent first. OpenAI API key required.");
      return;
    }

    setAnalyzingId(proposal.id);
    try {
      // Use the agent service to analyze the proposal
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
    } catch (error) {
      console.error("Error analyzing proposal:", error);
      alert("Error analyzing proposal. Please check your OpenAI API key.");
    } finally {
      setAnalyzingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="p-6 border rounded-lg bg-white dark:bg-gray-800 text-center">
        <p className="text-gray-500">No proposals found for this DAO.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Proposals</h2>
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          agent={agent}
          onAnalyze={handleAnalyze}
          analysis={analyses[proposal.id]}
          isAnalyzing={analyzingId === proposal.id}
        />
      ))}
    </div>
  );
}

