"use client";

import { useState, useCallback } from "react";
import { Keypair } from "@solana/web3.js";
import type { AIAgent, Proposal } from "@/types/dao";
import { analyzeProposal, GovernanceAgentConfig, createGovernanceAgent } from "@/lib/ai-agent";

interface AgentServiceState {
  agents: Map<string, GovernanceAgentConfig>;
  apiKeys: Map<string, string>; // Store masked API keys
  initialized: boolean;
}

export function useAgentService() {
  const [agentInstances, setAgentInstances] = useState<AgentServiceState>({
    agents: new Map(),
    apiKeys: new Map(),
    initialized: false,
  });

  /**
   * Initialize an AI agent instance
   */
  const initializeAgent = useCallback(
    async (
      agent: AIAgent,
      rpcUrl: string,
      openAIApiKey: string,
      walletKeypair?: Keypair
    ): Promise<GovernanceAgentConfig | null> => {
      try {
        // Generate a keypair for the agent if not provided
        const keypair = walletKeypair || Keypair.generate();
        
        const agentConfig = createGovernanceAgent(keypair, rpcUrl, openAIApiKey);

        // Mask API key for display (show first 7 and last 4 characters)
        const maskedKey = openAIApiKey.length > 11
          ? `${openAIApiKey.slice(0, 7)}...${openAIApiKey.slice(-4)}`
          : `${openAIApiKey.slice(0, 3)}...`;

        setAgentInstances((prev) => {
          const newAgents = new Map(prev.agents);
          const newApiKeys = new Map(prev.apiKeys);
          newAgents.set(agent.id, agentConfig);
          newApiKeys.set(agent.id, maskedKey);
          return {
            agents: newAgents,
            apiKeys: newApiKeys,
            initialized: true,
          };
        });

        return agentConfig;
      } catch (error) {
        console.error("Error initializing agent:", error);
        return null;
      }
    },
    []
  );

  /**
   * Get an agent instance by ID
   */
  const getAgent = useCallback(
    (agentId: string): GovernanceAgentConfig | undefined => {
      return agentInstances.agents.get(agentId);
    },
    [agentInstances]
  );

  /**
   * Analyze a proposal with a specific agent
   */
  const analyzeProposalWithAgent = useCallback(
    async (
      agentId: string,
      proposal: Proposal,
      agentPersonality: AIAgent
    ): Promise<{
      recommendation: "yes" | "no" | "abstain";
      reasoning: string;
      confidence: number;
      keyFactors?: string[];
    } | null> => {
      const agent = getAgent(agentId);
      if (!agent) {
        console.error("Agent not initialized");
        return null;
      }

      try {
        return await analyzeProposal(agent, proposal, agentPersonality);
      } catch (error) {
        console.error("Error analyzing proposal:", error);
        return null;
      }
    },
    [getAgent]
  );

  /**
   * Clean up agent instances
   */
  const cleanup = useCallback(() => {
    setAgentInstances({
      agents: new Map(),
      apiKeys: new Map(),
      initialized: false,
    });
  }, []);

  /**
   * Get masked API key for an agent
   */
  const getApiKey = useCallback(
    (agentId: string): string | undefined => {
      return agentInstances.apiKeys.get(agentId);
    },
    [agentInstances]
  );

  return {
    initializeAgent,
    getAgent,
    getApiKey,
    analyzeProposalWithAgent,
    cleanup,
    isInitialized: agentInstances.initialized,
  };
}
