"use client";

import { useState } from "react";
import type { AIAgent } from "@/types/dao";
import { useAgentServiceContext } from "@/contexts/AgentServiceContext";
import { rpc } from "@/lib/realms";

export function AgentInitializer({
  agent,
  onInitialized,
}: {
  agent: AIAgent;
  onInitialized: (success: boolean, maskedKey?: string) => void;
}) {
  const [openAIApiKey, setOpenAIApiKey] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const agentService = useAgentServiceContext();

  const handleInitialize = async () => {
    if (!openAIApiKey.trim()) {
      setError("Please enter your OpenAI API key");
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";
      const solanaAgent = await agentService.initializeAgent(
        agent,
        rpcUrl,
        openAIApiKey
      );

      if (solanaAgent) {
        // Mask API key for display
        const maskedKey = openAIApiKey.length > 11
          ? `${openAIApiKey.slice(0, 7)}...${openAIApiKey.slice(-4)}`
          : `${openAIApiKey.slice(0, 3)}...`;
        onInitialized(true, maskedKey);
      } else {
        setError("Failed to initialize agent. Please check your API key.");
        onInitialized(false);
      }
    } catch (err) {
      console.error("Error initializing agent:", err);
      setError("Failed to initialize agent. Please try again.");
      onInitialized(false);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500">
      <h3 className="font-semibold mb-2">Initialize {agent.name}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        To enable AI-powered proposal analysis, please provide your OpenAI API key.
        Your key is stored locally and never sent to our servers.
      </p>

      <div className="space-y-3">
        <input
          type="password"
          value={openAIApiKey}
          onChange={(e) => setOpenAIApiKey(e.target.value)}
          placeholder="sk-..."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        <button
          onClick={handleInitialize}
          disabled={isInitializing || !openAIApiKey.trim()}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isInitializing ? "Initializing..." : "Initialize Agent"}
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        Get your API key from{" "}
        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 hover:underline"
        >
          OpenAI Platform
        </a>
      </p>
    </div>
  );
}

