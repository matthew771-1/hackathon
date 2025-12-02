"use client";

import { useState } from "react";
import { ProposalList } from "./ProposalList";
import type { DAO, AIAgent } from "@/types/dao";
import { useAgentServiceContext } from "@/contexts/AgentServiceContext";
import { AgentActivity } from "./AgentActivity";
import { X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function DAODetail({
  dao,
  agents,
  onClose,
}: {
  dao: DAO;
  agents: AIAgent[];
  onClose: () => void;
}) {
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | undefined>(
    agents.length > 0 ? agents[0] : undefined
  );
  const agentService = useAgentServiceContext();
  const [agentActivities, setAgentActivities] = useState<any[]>([]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-6 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">{dao.name}</h2>
            {dao.description && (
              <p className="text-gray-600 dark:text-gray-400">{dao.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* DAO Stats */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(dao.treasury)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Treasury</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {dao.memberCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Members</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {dao.proposalCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Proposals</div>
            </div>
          </div>
        </div>

        {/* Agent Selector */}
        {agents.length > 0 && (
          <div className="p-6 border-b">
            <label className="block text-sm font-medium mb-2">Analyze with AI Agent:</label>
            <select
              value={selectedAgent?.id || ""}
              onChange={(e) => {
                const agent = agents.find((a) => a.id === e.target.value);
                setSelectedAgent(agent);
              }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.votingPreferences.riskTolerance})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Agent Activity (if delegated) */}
        {selectedAgent && (
          <div className="p-6 border-b">
            <AgentActivity 
              agent={selectedAgent} 
              daoAddress={dao.address}
              onActivityUpdate={(activity) => {
                setAgentActivities((prev) => [activity, ...prev].slice(0, 20));
              }}
            />
          </div>
        )}

        {/* Proposals */}
        <div className="p-6">
          <ProposalList
            daoAddress={dao.address}
            agent={selectedAgent}
            onActivityUpdate={(activity) => {
              setAgentActivities((prev) => [activity, ...prev].slice(0, 20));
            }}
          />
        </div>
      </div>
    </div>
  );
}

