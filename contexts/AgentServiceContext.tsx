"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAgentService } from "@/hooks/useAgentService";

const AgentServiceContext = createContext<ReturnType<typeof useAgentService> | null>(null);

export function AgentServiceProvider({ children }: { children: ReactNode }) {
  const agentService = useAgentService();
  return (
    <AgentServiceContext.Provider value={agentService}>
      {children}
    </AgentServiceContext.Provider>
  );
}

export function useAgentServiceContext() {
  const context = useContext(AgentServiceContext);
  if (!context) {
    throw new Error("useAgentServiceContext must be used within AgentServiceProvider");
  }
  return context;
}

