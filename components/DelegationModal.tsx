"use client";

import { useState } from "react";
import type { AIAgent } from "@/types/dao";
import { X } from "lucide-react";
import { POPULAR_SOLANA_DAOS } from "@/lib/realms";
import { delegateToAgent } from "@/lib/governance";
import { PublicKey } from "@solana/web3.js";

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
    } catch (error) {
      console.error("Delegation error:", error);
      setDelegationStatus("Delegation failed. Please try again.");
    } finally {
      setIsDelegating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Delegate {agent.name}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Delegate your governance voting power to <strong>{agent.name}</strong>. 
            The agent will be able to vote on proposals in the selected DAO on your behalf.
          </p>

          <div>
            <label className="block text-sm font-medium mb-2">Select DAO</label>
            <select
              value={selectedDAO}
              onChange={(e) => setSelectedDAO(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Choose a DAO...</option>
              {POPULAR_SOLANA_DAOS.map((dao) => (
                <option key={dao.address} value={dao.address}>
                  {dao.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold mb-2">How Delegation Works</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Your agent will analyze proposals automatically</li>
            <li>• Votes will be cast based on your agent&apos;s personality</li>
            <li>• You can revoke delegation at any time</li>
            <li>• Your tokens remain in your wallet (when possible)</li>
            </ul>
          </div>

          {delegationStatus && (
            <div
              className={`p-4 rounded-lg ${
                delegationStatus.includes("successful")
                  ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                  : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"
              }`}
            >
              {delegationStatus}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleDelegate}
              disabled={isDelegating || !selectedDAO}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDelegating ? "Delegating..." : "Delegate Governance Power"}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

