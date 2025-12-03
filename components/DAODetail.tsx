"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ProposalList } from "./ProposalList";
import type { DAO, AIAgent } from "@/types/dao";
import { AgentActivity, ActivityItem } from "./AgentActivity";
import { X, FileText, Bot } from "lucide-react";

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
  const [proposalCount, setProposalCount] = useState(dao.proposalCount);

  const handleProposalsLoaded = useCallback((count: number) => {
    setProposalCount(count);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-start z-10">
          <div className="flex items-center gap-4 flex-1">
            {dao.image && (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                <Image
                  src={dao.image}
                  alt={dao.name}
                  width={64}
                  height={64}
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <div>
              <h2 className="text-3xl font-bold mb-2 text-white">{dao.name}</h2>
              {dao.description && (
                <p className="text-slate-400">{dao.description}</p>
              )}
            </div>
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
          <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-lg max-w-xs mx-auto">
            <FileText className="w-5 h-5 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-400">
              {proposalCount}
            </div>
            <div className="text-sm text-slate-400 mt-1">Proposals</div>
          </div>
        </div>

        {/* Agent Selector */}
        {agents.length > 0 ? (
          <div className="p-6 border-b border-slate-800">
            <label className="block text-sm font-medium mb-2 text-slate-300">
              <Bot className="w-4 h-4 inline mr-2" />
              Analyze with AI Agent:
            </label>
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
        ) : (
          <div className="p-6 border-b border-slate-800">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-center">
              <Bot className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-amber-300 text-sm font-medium">No AI Agents Created</p>
              <p className="text-amber-300/70 text-xs mt-1">
                Create an agent in the &quot;My Agents&quot; tab to analyze proposals
              </p>
            </div>
          </div>
        )}

        {/* Agent Activity (only show if agent selected) */}
        {selectedAgent && (
          <div className="px-6 pt-6">
            <AgentActivity 
              agent={selectedAgent} 
              daoAddress={dao.address}
            />
          </div>
        )}

        {/* Proposals */}
        <div className="p-6">
          <ProposalList
            daoAddress={dao.address}
            daoNetwork={dao.network}
            governingTokenMint={dao.tokenMint}
            agent={selectedAgent}
            onProposalsLoaded={handleProposalsLoaded}
          />
        </div>
      </div>
    </div>
  );
}
