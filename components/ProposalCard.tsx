"use client";

import { useState } from "react";
import type { Proposal } from "@/types/dao";
import type { AIAgent } from "@/types/dao";
import { formatAddress, getTimeRemaining, getStatusColor } from "@/lib/utils";

interface ProposalAnalysis {
  recommendation: "yes" | "no" | "abstain";
  reasoning: string;
  confidence: number;
}

export function ProposalCard({
  proposal,
  agent,
  onAnalyze,
  analysis: externalAnalysis,
  isAnalyzing: externalIsAnalyzing,
}: {
  proposal: Proposal;
  agent?: AIAgent;
  onAnalyze?: (proposal: Proposal, agent: AIAgent) => Promise<void>;
  analysis?: ProposalAnalysis | null;
  isAnalyzing?: boolean;
}) {
  const [internalAnalysis, setInternalAnalysis] = useState<ProposalAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Use external analysis if provided, otherwise use internal state
  const analysis = externalAnalysis || internalAnalysis;
  const analyzing = externalIsAnalyzing !== undefined ? externalIsAnalyzing : isAnalyzing;

  const handleAnalyze = async () => {
    if (!agent || !onAnalyze) return;

    if (externalIsAnalyzing === undefined) {
      setIsAnalyzing(true);
    }

    try {
      await onAnalyze(proposal, agent);
      // Analysis will be set by parent component or internal state
    } catch (error) {
      console.error("Error analyzing proposal:", error);
    } finally {
      if (externalIsAnalyzing === undefined) {
        setIsAnalyzing(false);
      }
    }
  };


  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "yes":
        return "text-green-600 dark:text-green-400";
      case "no":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-white dark:bg-gray-800 hover:border-purple-500 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold flex-1">{proposal.title}</h3>
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(proposal.status)}`}>
          {proposal.status.toUpperCase()}
        </span>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{proposal.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Votes Yes:</span>
          <span className="ml-2 font-semibold text-green-600">{proposal.votesYes}</span>
        </div>
        <div>
          <span className="text-gray-500">Votes No:</span>
          <span className="ml-2 font-semibold text-red-600">{proposal.votesNo}</span>
        </div>
        <div>
          <span className="text-gray-500">Proposer:</span>
          <span className="ml-2 font-mono text-xs">{formatAddress(proposal.proposer)}</span>
        </div>
        <div>
          <span className="text-gray-500">
            {proposal.votingEndsAt ? "Ends:" : "Created:"}
          </span>
          <span className="ml-2">
            {proposal.votingEndsAt
              ? getTimeRemaining(proposal.votingEndsAt)
              : new Date(proposal.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {analysis && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className={`font-semibold ${getRecommendationColor(analysis.recommendation)}`}>
              Recommendation: {analysis.recommendation.toUpperCase()}
            </span>
            <span className="text-sm text-gray-500">
              Confidence: {analysis.confidence}%
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.reasoning}</p>
        </div>
      )}

      {agent && (
        <div className="flex gap-2">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? "Analyzing..." : `Analyze with ${agent.name}`}
          </button>
          {analysis && (
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Vote {analysis.recommendation === "yes" ? "Yes" : analysis.recommendation === "no" ? "No" : "Abstain"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

