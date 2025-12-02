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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Edit Agent</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Conservative Voter"
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

          {autoVote && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Minimum Confidence Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Agent will only auto-vote if confidence is above this threshold
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

