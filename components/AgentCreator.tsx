"use client";

import { useState } from "react";
import type { AIAgent, VotingPreferences } from "@/types/dao";
import { Plus, Sparkles, Shield, Zap, Scale, Users, DollarSign, Info } from "lucide-react";

export function AgentCreator({ onAgentCreated }: { onAgentCreated: (agent: AIAgent) => void }) {
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("");
  const [riskTolerance, setRiskTolerance] = useState<VotingPreferences["riskTolerance"]>("moderate");
  const [autoVote, setAutoVote] = useState(true);
  const [minConfidence, setMinConfidence] = useState(70);
  
  // Governance preferences
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [decisionSpeed, setDecisionSpeed] = useState<"fast" | "deliberate">("deliberate");
  const [treasuryPriority, setTreasuryPriority] = useState<"growth" | "preservation">("preservation");

  const availableFocusAreas = [
    { id: "treasury", label: "Treasury Management", icon: DollarSign },
    { id: "security", label: "Security & Safety", icon: Shield },
    { id: "growth", label: "Growth & Expansion", icon: Zap },
    { id: "community", label: "Community Building", icon: Users },
    { id: "governance", label: "Governance Structure", icon: Scale },
  ];

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const agent: AIAgent = {
      id: `agent-${Date.now()}`,
      name,
      personality,
      votingPreferences: {
        riskTolerance,
        focusAreas,
        autoVote,
        minVotingThreshold: minConfidence,
        decisionSpeed,
        treasuryPriority,
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
    setMinConfidence(70);
    setFocusAreas([]);
    setDecisionSpeed("deliberate");
    setTreasuryPriority("preservation");
  };

  return (
    <div className="p-6 border border-slate-800 rounded-xl bg-slate-900/50 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Create AI Agent</h2>
          <p className="text-sm text-slate-400">Define your agent&apos;s personality and governance preferences</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              placeholder="e.g., Treasury Guardian"
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
              <option value="conservative" className="bg-slate-900">🛡️ Conservative - Prioritize safety</option>
              <option value="moderate" className="bg-slate-900">⚖️ Moderate - Balanced approach</option>
              <option value="aggressive" className="bg-slate-900">🚀 Aggressive - Embrace risk for growth</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-slate-300">
            Values & Decision-Making Approach
          </label>
          <textarea
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
            rows={3}
            placeholder="e.g., Prioritize long-term sustainability over short-term gains. Support proposals that strengthen community participation. Be skeptical of large treasury expenditures without clear ROI..."
            required
          />
        </div>

        {/* Focus Areas */}
        <div>
          <label className="block text-sm font-medium mb-3 text-slate-300">
            Priority Focus Areas
            <span className="text-slate-500 font-normal ml-2">(select all that apply)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {availableFocusAreas.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleFocusArea(id)}
                className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all ${
                  focusAreas.includes(id)
                    ? "bg-purple-600/20 border-purple-500 text-purple-300"
                    : "bg-slate-950/50 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Governance Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Decision Speed</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDecisionSpeed("deliberate")}
                className={`flex-1 px-4 py-2.5 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                  decisionSpeed === "deliberate"
                    ? "bg-purple-600/20 border-purple-500 text-purple-300"
                    : "bg-slate-950/50 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <Scale className="w-4 h-4" />
                Deliberate
              </button>
              <button
                type="button"
                onClick={() => setDecisionSpeed("fast")}
                className={`flex-1 px-4 py-2.5 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                  decisionSpeed === "fast"
                    ? "bg-purple-600/20 border-purple-500 text-purple-300"
                    : "bg-slate-950/50 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <Zap className="w-4 h-4" />
                Fast
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {decisionSpeed === "deliberate" 
                ? "Wait for more votes before deciding"
                : "Vote early based on initial analysis"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Treasury Priority</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTreasuryPriority("preservation")}
                className={`flex-1 px-4 py-2.5 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                  treasuryPriority === "preservation"
                    ? "bg-purple-600/20 border-purple-500 text-purple-300"
                    : "bg-slate-950/50 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <Shield className="w-4 h-4" />
                Preserve
              </button>
              <button
                type="button"
                onClick={() => setTreasuryPriority("growth")}
                className={`flex-1 px-4 py-2.5 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                  treasuryPriority === "growth"
                    ? "bg-purple-600/20 border-purple-500 text-purple-300"
                    : "bg-slate-950/50 border-slate-700 text-slate-400 hover:border-slate-600"
                }`}
              >
                <Zap className="w-4 h-4" />
                Grow
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {treasuryPriority === "preservation" 
                ? "Protect treasury, approve only essential spending"
                : "Support investments for growth"}
            </p>
          </div>
        </div>

        {/* Automation Settings */}
        <div className="p-4 bg-slate-950/50 rounded-lg border border-slate-700">
          <div className="flex items-start gap-3 mb-4">
            <input
              type="checkbox"
              id="autoVote"
              checked={autoVote}
              onChange={(e) => setAutoVote(e.target.checked)}
              className="w-5 h-5 mt-0.5 text-purple-600 rounded focus:ring-purple-500 bg-slate-950/50 border-slate-700"
            />
            <div>
              <label htmlFor="autoVote" className="text-sm font-medium text-white cursor-pointer">
                Enable Automatic Voting
              </label>
              <p className="text-xs text-slate-400 mt-0.5">
                Agent will automatically vote on proposals when confidence is high enough
              </p>
            </div>
          </div>

          {autoVote && (
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Minimum Confidence for Auto-Vote: {minConfidence}%
              </label>
              <input
                type="range"
                min="50"
                max="95"
                value={minConfidence}
                onChange={(e) => setMinConfidence(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>More votes (50%)</span>
                <span>Fewer votes (95%)</span>
              </div>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">How it works</p>
            <p className="text-blue-300/80">
              Your agent will analyze each proposal based on these preferences and provide a YES/NO/ABSTAIN 
              recommendation with reasoning. If auto-vote is enabled, it will vote automatically when confident.
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full px-6 py-3.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Create Agent
        </button>
      </form>
    </div>
  );
}
