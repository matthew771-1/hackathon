"use client";

import { useState } from "react";
import type { AIAgent } from "@/types/dao";
import { AgentInitializer } from "./AgentInitializer";
import { useAgentServiceContext } from "@/contexts/AgentServiceContext";
import { AgentEditor } from "./AgentEditor";
import { DelegationModal } from "./DelegationModal";
import { Bot, Edit, Send, CheckCircle2, Circle, Key } from "lucide-react";

export function AgentList({ 
  agents, 
  onAgentUpdate 
}: { 
  agents: AIAgent[];
  onAgentUpdate?: (updatedAgent: AIAgent) => void;
}) {
  const agentService = useAgentServiceContext();
  const [initializingAgent, setInitializingAgent] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [delegatingAgent, setDelegatingAgent] = useState<AIAgent | null>(null);
  const [initSuccess, setInitSuccess] = useState<string | null>(null);
  if (agents.length === 0) {
    return (
      <div className="p-8 border border-slate-800 rounded-xl bg-slate-900/50 text-center">
        <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">No agents created yet. Create your first AI agent to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        <Bot className="w-6 h-6" />
        Your AI Agents
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`p-6 border rounded-xl transition-all ${
              agent.isActive
                ? "border-green-500/50 bg-slate-900/50"
                : "border-slate-800 bg-slate-900/50"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <Bot className={`w-5 h-5 ${agent.isActive ? "text-green-400" : "text-slate-500"}`} />
                <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
              </div>
              <span
                className={`px-2.5 py-1 text-xs rounded-full flex items-center gap-1 ${
                  agent.isActive
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}
              >
                {agent.isActive ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                {agent.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-4 line-clamp-2">
              {agent.personality}
            </p>
            <div className="space-y-2 text-sm mb-4 p-3 bg-slate-950/50 rounded-lg border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Risk Tolerance:</span>
                <span className="font-medium text-slate-300 capitalize">{agent.votingPreferences.riskTolerance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Auto Vote:</span>
                <span className="font-medium text-slate-300">{agent.votingPreferences.autoVote ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Created:</span>
                <span className="font-medium text-slate-300">
                  {new Date(agent.createdAt).toLocaleDateString()}
                </span>
              </div>
              {agentService.getApiKey(agent.id) && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    API Key:
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {agentService.getApiKey(agent.id)}
                  </span>
                </div>
              )}
            </div>
            {initSuccess && (
              <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-400">{initSuccess}</p>
              </div>
            )}
            <div className="mt-4 space-y-2">
              {initializingAgent === agent.id ? (
                <AgentInitializer
                  agent={agent}
                  onInitialized={(success, maskedKey) => {
                    if (success) {
                      setInitSuccess(`Agent initialized successfully! API Key: ${maskedKey}`);
                      setInitializingAgent(null);
                      // Clear success message after 5 seconds
                      setTimeout(() => setInitSuccess(null), 5000);
                    } else if (success === false && maskedKey === undefined) {
                      // Cancel was clicked
                      setInitializingAgent(null);
                    }
                  }}
                />
              ) : (
                <>
                  {!agentService.getAgent(agent.id) && (
                    <button
                      onClick={() => setInitializingAgent(agent.id)}
                      className="w-full px-4 py-2.5 bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-600/30 transition-colors text-sm"
                    >
                      Initialize AI Agent (Requires OpenAI API Key)
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDelegatingAgent(agent)}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Delegate
                    </button>
                    <button
                      onClick={() => setEditingAgent(agent)}
                      className="px-4 py-2.5 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {editingAgent && (
        <AgentEditor
          agent={editingAgent}
          onSave={(updatedAgent) => {
            if (onAgentUpdate) {
              onAgentUpdate(updatedAgent);
            }
            setEditingAgent(null);
          }}
          onCancel={() => setEditingAgent(null)}
        />
      )}

      {delegatingAgent && (
        <DelegationModal
          agent={delegatingAgent}
          onClose={() => setDelegatingAgent(null)}
        />
      )}
    </div>
  );
}

