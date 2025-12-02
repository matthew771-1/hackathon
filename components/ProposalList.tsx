"use client";

import { useState, useEffect } from "react";
import { ProposalCard } from "./ProposalCard";
import type { Proposal, AIAgent } from "@/types/dao";
import { useAgentServiceContext } from "@/contexts/AgentServiceContext";
import type { Activity } from "./AgentActivity";

export function ProposalList({
  daoAddress,
  agent,
  onActivityUpdate,
}: {
  daoAddress: string;
  agent?: AIAgent;
  onActivityUpdate?: (activity: Activity) => void;
}) {
  const agentService = useAgentServiceContext();
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
    if (!agentService) {
      console.error("Agent service not available");
      alert("Agent service not available. Please refresh the page.");
      return;
    }

    const agentInstance = agentService.getAgent(agent.id);
    if (!agentInstance) {
      console.error("Agent not initialized");
      alert("Please initialize the AI agent first. Click 'Initialize AI Agent' and enter your OpenAI API key.");
      return;
    }

    setAnalyzingId(proposal.id);
    
    // Add analyzing activity
    if (onActivityUpdate) {
      onActivityUpdate({
        id: `analyzing-${proposal.id}`,
        type: "analyzing",
        proposalId: proposal.id,
        proposalTitle: proposal.title,
        timestamp: new Date(),
        status: "in_progress",
        message: `Analyzing proposal: "${proposal.title}"...`,
      });
    }

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

        // Add completed activity
        if (onActivityUpdate) {
          onActivityUpdate({
            id: `completed-${proposal.id}`,
            type: "completed",
            proposalId: proposal.id,
            proposalTitle: proposal.title,
            timestamp: new Date(),
            status: "completed",
            message: `Analysis complete: ${analysis.recommendation.toUpperCase()} vote (${analysis.confidence}% confidence)`,
          });
        }
      }
    } catch (error) {
      console.error("Error analyzing proposal:", error);
      
      // Add failed activity
      if (onActivityUpdate) {
        onActivityUpdate({
          id: `failed-${proposal.id}`,
          type: "analyzing",
          proposalId: proposal.id,
          proposalTitle: proposal.title,
          timestamp: new Date(),
          status: "failed",
          message: `Failed to analyze proposal: "${proposal.title}"`,
        });
      }
      
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

