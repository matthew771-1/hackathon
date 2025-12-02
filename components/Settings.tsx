"use client";

import { useState } from "react";
import { APP_CONFIG, getRpcUrl } from "@/lib/config";
import { X, Save, Info } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Network Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">Network</label>
            <select
              value={network}
              onChange={(e) => {
                const newNetwork = e.target.value as "devnet" | "mainnet";
                setNetwork(newNetwork);
                setRpcUrl(getRpcUrl(newNetwork));
              }}
              className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            >
              <option value="devnet" className="bg-slate-900">Devnet</option>
              <option value="mainnet" className="bg-slate-900">Mainnet</option>
            </select>
          </div>

          {/* RPC URL */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">RPC Endpoint</label>
            <input
              type="text"
              value={rpcUrl}
              onChange={(e) => setRpcUrl(e.target.value)}
              placeholder="https://api.devnet.solana.com"
              className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            />
            <p className="text-xs text-slate-500 mt-1">
              You can use a custom RPC endpoint for better performance (e.g., Helius, QuickNode)
            </p>
          </div>

          {/* Info Section */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-400 flex items-center gap-2">
              <Info className="w-4 h-4" />
              About Settings
            </h3>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Settings are saved locally in your browser</li>
              <li>• Changing network will affect which DAOs you can access</li>
              <li>• Custom RPC endpoints can improve performance</li>
            </ul>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saved ? "Saved" : "Save Settings"}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

