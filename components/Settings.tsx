"use client";

import { useState } from "react";
import { APP_CONFIG, getRpcUrl } from "@/lib/config";

export function Settings({ onClose }: { onClose: () => void }) {
  const [rpcUrl, setRpcUrl] = useState(getRpcUrl("devnet"));
  const [network, setNetwork] = useState<"devnet" | "mainnet">("devnet");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real app, you'd save this to localStorage or a config file
    localStorage.setItem("solana_rpc_url", rpcUrl);
    localStorage.setItem("solana_network", network);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Network Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Network</label>
            <select
              value={network}
              onChange={(e) => {
                const newNetwork = e.target.value as "devnet" | "mainnet";
                setNetwork(newNetwork);
                setRpcUrl(getRpcUrl(newNetwork));
              }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="devnet">Devnet</option>
              <option value="mainnet">Mainnet</option>
            </select>
          </div>

          {/* RPC URL */}
          <div>
            <label className="block text-sm font-medium mb-2">RPC Endpoint</label>
            <input
              type="text"
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
              placeholder="https://api.devnet.solana.com"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              You can use a custom RPC endpoint for better performance (e.g., Helius, QuickNode)
            </p>
          </div>

          {/* Info Section */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold mb-2">About Settings</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Settings are saved locally in your browser</li>
              <li>• Changing network will affect which DAOs you can access</li>
              <li>• Custom RPC endpoints can improve performance</li>
            </ul>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {saved ? "✓ Saved" : "Save Settings"}
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

