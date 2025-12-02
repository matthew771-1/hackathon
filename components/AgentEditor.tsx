"use client";

import { useState } from "react";
import type { AIAgent, VotingPreferences } from "@/types/dao";
import { X } from "lucide-react";

export function AgentEditor({
  agent,
  onSave,
  onCancel,
}: {
  agent: AIAgent;
  onSave: (updatedAgent: AIAgent) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(agent.name);
  const [personality, setPersonality] = useState(agent.personality);
  const [riskTolerance, setRiskTolerance] = useState<VotingPreferences["riskTolerance"]>(
    agent.votingPreferences.riskTolerance
  );
  const [autoVote, setAutoVote] = useState(agent.votingPreferences.autoVote);
  const [minConfidence, setMinConfidence] = useState(
    agent.votingPreferences.minVotingThreshold || 70
  );

  const handleSave = () => {
    const updatedAgent: AIAgent = {
      ...agent,
      name,
      personality,
      votingPreferences: {
        ...agent.votingPreferences,
        riskTolerance,
        autoVote,
        minVotingThreshold: minConfidence,
      },
    };
    onSave(updatedAgent);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Edit Agent</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              placeholder="e.g., Conservative Voter"
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

          {autoVote && (
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Minimum Confidence Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
              <p className="text-xs text-slate-500 mt-1">
                Agent will only auto-vote if confidence is above this threshold
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all shadow-lg shadow-purple-500/20"
            >
              Save Changes
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

