"use client";

import { useState } from "react";
import type { AIAgent } from "@/types/dao";
import { useAgentServiceContext } from "@/contexts/AgentServiceContext";
import { validateOpenAIKey } from "@/lib/ai-agent";
import { Key, Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";

export function AgentInitializer({
  agent,
  onInitialized,
}: {
  agent: AIAgent;
  onInitialized: (success: boolean, maskedKey?: string) => void;
}) {
  const [openAIApiKey, setOpenAIApiKey] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<"idle" | "valid" | "invalid">("idle");
  const agentService = useAgentServiceContext();

  const handleKeyChange = (value: string) => {
    setOpenAIApiKey(value);
    setError(null);
    setValidationStatus("idle");
  };

  const handleValidateKey = async () => {
    if (!openAIApiKey.trim()) {
      setError("Please enter your OpenAI API key");
      return;
    }

    // Basic format check
    if (!openAIApiKey.startsWith("sk-")) {
      setError("Invalid API key format. OpenAI keys start with 'sk-'");
      setValidationStatus("invalid");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const isValid = await validateOpenAIKey(openAIApiKey);
      
      if (isValid) {
        setValidationStatus("valid");
      } else {
        setValidationStatus("invalid");
        setError("Invalid API key. Please check and try again.");
      }
    } catch (err) {
      setValidationStatus("invalid");
      setError("Could not validate API key. Please check your internet connection.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleInitialize = async () => {
    if (!openAIApiKey.trim()) {
      setError("Please enter your OpenAI API key");
      return;
    }

    // Validate first if not already validated
    if (validationStatus !== "valid") {
      await handleValidateKey();
      if (validationStatus === "invalid") return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || "https://api.mainnet-beta.solana.com";
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
    } catch (err: any) {
      console.error("Error initializing agent:", err);
      setError(err.message || "Failed to initialize agent. Please try again.");
      onInitialized(false);
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div className="p-5 border rounded-xl bg-amber-500/10 border-amber-500/30">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <Key className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Initialize {agent.name}</h3>
          <p className="text-xs text-slate-400">Enter your OpenAI API key to enable AI analysis</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <input
            type="password"
            value={openAIApiKey}
            onChange={(e) => handleKeyChange(e.target.value)}
            placeholder="sk-proj-..."
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all pr-10"
          />
          {validationStatus === "valid" && (
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" />
          )}
          {validationStatus === "invalid" && (
            <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {validationStatus === "valid" && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-400">API key validated successfully!</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              setOpenAIApiKey("");
              setError(null);
              setValidationStatus("idle");
              onInitialized(false);
            }}
            className="flex-1 px-4 py-2.5 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          
          {validationStatus !== "valid" ? (
            <button
              onClick={handleValidateKey}
              disabled={isValidating || !openAIApiKey.trim()}
              className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isValidating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating...
                </>
              ) : (
                "Validate Key"
              )}
            </button>
          ) : (
            <button
              onClick={handleInitialize}
              disabled={isInitializing}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                "Initialize Agent"
              )}
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
        Get your API key from{" "}
        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
        >
          OpenAI Platform
          <ExternalLink className="w-3 h-3" />
        </a>
      </p>
    </div>
  );
}
