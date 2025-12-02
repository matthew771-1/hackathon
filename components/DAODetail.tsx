"use client";

import { useState } from "react";
import { ProposalList } from "./ProposalList";
import type { DAO, AIAgent } from "@/types/dao";
import { useAgentServiceContext } from "@/contexts/AgentServiceContext";
import { AgentActivity } from "./AgentActivity";
import { X, Wallet, Users, FileText } from "lucide-react";
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-start z-10">
          <div>
            <h2 className="text-3xl font-bold mb-2 text-white">{dao.name}</h2>
            {dao.description && (
              <p className="text-slate-400">{dao.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* DAO Stats */}
        <div className="p-6 border-b border-slate-800">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <Wallet className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-400">
                {formatCurrency(dao.treasury)}
              </div>
              <div className="text-sm text-slate-400 mt-1">Treasury</div>
            </div>
            <div className="text-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-400">
                {dao.memberCount}
              </div>
              <div className="text-sm text-slate-400 mt-1">Members</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <FileText className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-400">
                {dao.proposalCount}
              </div>
              <div className="text-sm text-slate-400 mt-1">Proposals</div>
            </div>
          </div>
        </div>

        {/* Agent Selector */}
        {agents.length > 0 && (
          <div className="p-6 border-b border-slate-800">
            <label className="block text-sm font-medium mb-2 text-slate-300">Analyze with AI Agent:</label>
            <select
              value={selectedAgent?.id || ""}
              onChange={(e) => {
                const agent = agents.find((a) => a.id === e.target.value);
                setSelectedAgent(agent);
              }}
              className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id} className="bg-slate-900">
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

