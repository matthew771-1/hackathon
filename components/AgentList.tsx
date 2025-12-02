"use client";

import { useState } from "react";
import type { AIAgent } from "@/types/dao";
import { AgentInitializer } from "./AgentInitializer";
import { useAgentServiceContext } from "@/contexts/AgentServiceContext";
import { AgentEditor } from "./AgentEditor";
import { DelegationModal } from "./DelegationModal";

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
      <div className="p-6 border rounded-lg bg-white dark:bg-gray-800 text-center">
        <p className="text-gray-500">No agents created yet. Create your first AI agent to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Your AI Agents</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`p-6 border rounded-lg ${
              agent.isActive
                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                : "bg-white dark:bg-gray-800"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-semibold">{agent.name}</h3>
              <span
                className={`px-2 py-1 text-xs rounded ${
                  agent.isActive
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-700"
                }`}
              >
                {agent.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {agent.personality}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Risk Tolerance:</span>
                <span className="font-medium capitalize">{agent.votingPreferences.riskTolerance}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Auto Vote:</span>
                <span className="font-medium">{agent.votingPreferences.autoVote ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created:</span>
                <span className="font-medium">
                  {new Date(agent.createdAt).toLocaleDateString()}
                </span>
              </div>
              {agentService.getApiKey(agent.id) && (
                <div className="flex justify-between">
                  <span className="text-gray-500">API Key:</span>
                  <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                    {agentService.getApiKey(agent.id)}
                  </span>
                </div>
              )}
            </div>
            {initSuccess && (
              <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-500 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-300">{initSuccess}</p>
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
                    }
                  }}
                />
              ) : (
                <>
                  {!agentService.getAgent(agent.id) && (
                    <button
                      onClick={() => setInitializingAgent(agent.id)}
                      className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                    >
                      Initialize AI Agent (Requires OpenAI API Key)
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDelegatingAgent(agent)}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Delegate
                    </button>
                    <button
                      onClick={() => setEditingAgent(agent)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Edit
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

