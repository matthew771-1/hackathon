"use client";

import { X, Bot, Shield, Zap, Clock, AlertTriangle, CheckCircle2, Wallet } from "lucide-react";
import type { AIAgent, DAO } from "@/types/dao";
import { useWalletContext } from "./WalletProvider";

interface DelegationConfirmModalProps {
  agent: AIAgent;
  dao: DAO;
  onConfirm: () => void;
  onClose: () => void;
}

export function DelegationConfirmModal({
  agent,
  dao,
  onConfirm,
  onClose,
}: DelegationConfirmModalProps) {
  const { isConnected, publicKey } = useWalletContext();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900 border border-purple-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 flex items-center justify-center border border-purple-500/30">
              <Bot className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Delegate to {agent.name}</h2>
              <p className="text-sm text-slate-400">for {dao.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wallet Status */}
        {!isConnected ? (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-medium text-amber-400">Wallet Not Connected</p>
                <p className="text-sm text-slate-400">
                  Connect your wallet to enable automatic voting. You can still delegate, but votes will need manual confirmation.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-green-400" />
              <div>
                <p className="font-medium text-green-400">Wallet Connected</p>
                <p className="text-sm text-slate-400 font-mono">
                  {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* What happens section */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider">
            What happens when you delegate:
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="font-medium text-white">Automatic Analysis</p>
                <p className="text-sm text-slate-400">
                  The AI agent will analyze all active proposals based on its personality and your preferences
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
              <Clock className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <p className="font-medium text-white">Scheduled Voting</p>
                <p className="text-sm text-slate-400">
                  {agent.votingPreferences.autoVote 
                    ? "Votes will be scheduled and executed automatically when ready"
                    : "Votes will be scheduled but require manual confirmation"}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="font-medium text-white">Full Control</p>
                <p className="text-sm text-slate-400">
                  You can cancel any scheduled vote and revoke delegation at any time
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Settings Summary */}
        <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Agent Configuration</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">Risk Tolerance:</span>
              <span className="ml-2 text-white capitalize">{agent.votingPreferences.riskTolerance}</span>
            </div>
            <div>
              <span className="text-slate-500">Auto-Vote:</span>
              <span className={`ml-2 ${agent.votingPreferences.autoVote ? "text-green-400" : "text-slate-400"}`}>
                {agent.votingPreferences.autoVote ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Min Confidence:</span>
              <span className="ml-2 text-white">{agent.votingPreferences.minVotingThreshold || 70}%</span>
            </div>
            <div>
              <span className="text-slate-500">Focus Areas:</span>
              <span className="ml-2 text-white">{agent.votingPreferences.focusAreas.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-200">
              <p className="font-medium mb-1">Important Note</p>
              <p className="text-amber-200/80">
                Votes are submitted on-chain using your wallet. Make sure you have {dao.token || "governance tokens"} and 
                SOL for transaction fees. The agent cannot spend or transfer your tokens - only vote with your governance power.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-xl hover:from-purple-700 hover:to-fuchsia-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 font-medium"
          >
            <Bot className="w-5 h-5" />
            Confirm Delegation
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors text-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

