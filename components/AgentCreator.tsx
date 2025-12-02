"use client";

import { useState } from "react";
import type { AIAgent, VotingPreferences } from "@/types/dao";
import { Plus, Sparkles } from "lucide-react";

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
    <div className="p-6 border border-slate-800 rounded-xl bg-slate-900/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Create AI Agent</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-300">Agent Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            placeholder="e.g., Conservative Voter"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-300">Personality & Preferences</label>
          <textarea
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
            rows={4}
            placeholder="Describe your agent's personality, values, and decision-making approach..."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-300">Risk Tolerance</label>
          <select
            value={riskTolerance}
            onChange={(e) => setRiskTolerance(e.target.value as VotingPreferences["riskTolerance"])}
            className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          >
            <option value="conservative" className="bg-slate-900">Conservative</option>
            <option value="moderate" className="bg-slate-900">Moderate</option>
            <option value="aggressive" className="bg-slate-900">Aggressive</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoVote"
            checked={autoVote}
            onChange={(e) => setAutoVote(e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 bg-slate-950/50 border-slate-700"
          />
          <label htmlFor="autoVote" className="text-sm text-slate-300">
            Enable automatic voting
          </label>
        </div>

        <button
          type="submit"
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Create Agent
        </button>
      </form>
    </div>
  );
}

