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
        <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              DAO AI Agent
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
              Delegate your governance power to AI agents that analyze proposals and vote on your behalf
            </p>
            
            {/* Wallet Connection */}
            <div className="mb-8 flex items-center gap-4">
              <WalletButton />
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                ⚙️ Settings
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab("agents")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "agents"
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              My Agents
            </button>
            <button
              onClick={() => setActiveTab("daos")}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === "daos"
                  ? "border-b-2 border-purple-600 text-purple-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Browse DAOs
            </button>
          </div>

          {/* Content */}
          <div className="space-y-8">
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


