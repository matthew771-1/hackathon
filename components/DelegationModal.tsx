"use client";

import { useState } from "react";
import type { AIAgent } from "@/types/dao";
import { X, Send, Info } from "lucide-react";
import { POPULAR_SOLANA_DAOS } from "@/lib/realms";
import { delegateToAgent } from "@/lib/governance";
import { PublicKey } from "@solana/web3.js";
import { AgentActivity } from "./AgentActivity";

export function DelegationModal({
  agent,
  onClose,
}: {
  agent: AIAgent;
  onClose: () => void;
}) {
  const [selectedDAO, setSelectedDAO] = useState<string>("");
  const [isDelegating, setIsDelegating] = useState(false);
  const [delegationStatus, setDelegationStatus] = useState<string | null>(null);
  const [isDelegated, setIsDelegated] = useState(false);

  const handleDelegate = async () => {
    if (!selectedDAO) {
      alert("Please select a DAO to delegate to");
      return;
    }

    setIsDelegating(true);
    setDelegationStatus(null);

    try {
      // TODO: Get actual user wallet public key from wallet connection
      // For now, using a placeholder
      const userPublicKey = new PublicKey("11111111111111111111111111111111");
      
      const signature = await delegateToAgent(
        selectedDAO,
        agent.id, // Using agent ID as agent address for now
        userPublicKey
      );

      setDelegationStatus(`Delegation successful! Transaction: ${signature.slice(0, 8)}...`);
      setIsDelegated(true);
    } catch (error) {
      console.error("Delegation error:", error);
      setDelegationStatus("Delegation failed. Please try again.");
    } finally {
      setIsDelegating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Delegate {agent.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-5">
          <p className="text-slate-400">
            Delegate your governance voting power to <strong className="text-white">{agent.name}</strong>. 
            The agent will be able to vote on proposals in the selected DAO on your behalf.
          </p>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Select DAO</label>
            <select
              value={selectedDAO}
              onChange={(e) => setSelectedDAO(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            >
              <option value="" className="bg-slate-900">Choose a DAO...</option>
              {POPULAR_SOLANA_DAOS.map((dao) => (
                <option key={dao.address} value={dao.address} className="bg-slate-900">
                  {dao.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-400 flex items-center gap-2">
              <Info className="w-4 h-4" />
              How Delegation Works
            </h3>
            <ul className="text-sm text-slate-400 space-y-1">
            <li>• Your agent will analyze proposals automatically</li>
            <li>• Votes will be cast based on your agent&apos;s personality</li>
            <li>• You can revoke delegation at any time</li>
            <li>• Your tokens remain in your wallet (when possible)</li>
            </ul>
          </div>

          {delegationStatus && (
            <div
              className={`p-4 rounded-lg border ${
                delegationStatus.includes("successful")
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              {delegationStatus}
            </div>
          )}

          {isDelegated && selectedDAO && (
            <div className="mt-4">
              <AgentActivity agent={agent} daoAddress={selectedDAO} />
            </div>
          )}

          {!isDelegated && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleDelegate}
                disabled={isDelegating || !selectedDAO}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
              >
                <Send className="w-4 h-4" />
                {isDelegating ? "Delegating..." : "Delegate Governance Power"}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors text-slate-300"
              >
                Cancel
              </button>
            </div>
          )}

          {isDelegated && (
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all shadow-lg shadow-purple-500/20"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

