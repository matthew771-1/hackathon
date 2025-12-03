"use client";

import { useState } from "react";
import { WalletProvider } from "@/components/WalletProvider";
import { WalletButton } from "@/components/WalletButton";
import { DAOList } from "@/components/DAOList";
import { AgentCreator } from "@/components/AgentCreator";
import { AgentList } from "@/components/AgentList";
import { Settings } from "@/components/Settings";
import { AgentServiceProvider } from "@/contexts/AgentServiceContext";
import type { AIAgent } from "@/types/dao";
import { Settings as SettingsIcon, Bot, Sparkles } from "lucide-react";

export default function Home() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [activeTab, setActiveTab] = useState<"agents" | "daos">("agents");
  const [showSettings, setShowSettings] = useState(false);

  const handleAgentCreated = (agent: AIAgent) => {
    setAgents([...agents, agent]);
    setActiveTab("agents");
  };

  const handleAgentUpdate = (updatedAgent: AIAgent) => {
    setAgents(agents.map((a) => (a.id === updatedAgent.id ? updatedAgent : a)));
  };

  return (
    <WalletProvider>
      <AgentServiceProvider>
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Fixed Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 gap-4">
              {/* Left Side - Logo & Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-semibold text-white">
                  DAO AI Agent
                </h1>
              </div>
              
              {/* Right Side - Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all flex items-center justify-center shadow-lg shadow-purple-500/20"
                >
                  <SettingsIcon className="w-4 h-4" />
                </button>
                <WalletButton />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Add padding top to account for fixed header */}
        <div className="max-w-7xl mx-auto p-6 md:p-8 pt-24">
          {/* Hero Section */}
          <div className="mb-10 mt-16 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-xs font-medium text-purple-400">Powered by AI</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Delegate Your Governance Power
            </h2>
            <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto">
              Create AI agents that analyze proposals and vote on your behalf. Stay involved in DAO governance without the time commitment.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setActiveTab("agents")}
              className={`px-6 py-3 font-semibold transition-all rounded-lg ${
                activeTab === "agents"
                  ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-900/50"
              }`}
            >
              My Agents
            </button>
            <button
              onClick={() => setActiveTab("daos")}
              className={`px-6 py-3 font-semibold transition-all rounded-lg ${
                activeTab === "daos"
                  ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-900/50"
              }`}
            >
              Browse DAOs
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {activeTab === "agents" ? (
              <>
                <AgentCreator onAgentCreated={handleAgentCreated} />
                <AgentList agents={agents} onAgentUpdate={handleAgentUpdate} />
              </>
            ) : (
              <DAOList agents={agents} />
            )}
          </div>
        </div>

        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
        </main>
      </AgentServiceProvider>
    </WalletProvider>
  );
}
