"use client";

import { useState } from "react";
import type { AIAgent, VotingPreferences } from "@/types/dao";

export function AgentCreator({ onAgentCreated }: { onAgentCreated: (agent: AIAgent) => void }) {
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("");
  const [riskTolerance, setRiskTolerance] = useState<VotingPreferences["riskTolerance"]>("moderate");
  const [autoVote, setAutoVote] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const agent: AIAgent = {
      id: `agent-${Date.now()}`,
      name,
      personality,
      votingPreferences: {
        riskTolerance,
        focusAreas: [],
        autoVote,
      },
      createdAt: new Date(),
      isActive: true,
    };

    onAgentCreated(agent);
    
    // Reset form
    setName("");
    setPersonality("");
    setRiskTolerance("moderate");
    setAutoVote(true);
  };

  return (
    <div className="p-6 border rounded-lg bg-white dark:bg-gray-800">
      <h2 className="text-2xl font-bold mb-4">Create AI Agent</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Agent Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="e.g., Conservative Voter"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Personality & Preferences</label>
          <textarea
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            rows={4}
            placeholder="Describe your agent's personality, values, and decision-making approach..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Risk Tolerance</label>
          <select
            value={riskTolerance}
            onChange={(e) => setRiskTolerance(e.target.value as VotingPreferences["riskTolerance"])}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoVote"
            checked={autoVote}
            onChange={(e) => setAutoVote(e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
          />
          <label htmlFor="autoVote" className="ml-2 text-sm">
            Enable automatic voting
          </label>
        </div>

        <button
          type="submit"
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
        >
          Create Agent
        </button>
      </form>
    </div>
  );
}

