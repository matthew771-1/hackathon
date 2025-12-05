"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Transaction } from "@solana/web3.js";
import type { AIAgent, ScheduledVote, DAO } from "@/types/dao";
import { useWalletContext } from "./WalletProvider";
import { 
  Bot, 
  Clock, 
  ThumbsUp, 
  ThumbsDown, 
  Zap,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Activity,
  Play,
  Loader2,
  AlertCircle,
  Wallet,
  Shield
} from "lucide-react";

interface AIAgentPanelProps {
  agent: AIAgent;
  dao: DAO;
  scheduledVotes: ScheduledVote[];
  onCancelVote?: (voteId: string) => void;
  onExecuteVote?: (voteId: string, signature: string) => void;
}

export function AIAgentPanel({
  agent,
  dao,
  scheduledVotes,
  onCancelVote,
  onExecuteVote,
}: AIAgentPanelProps) {
  const { publicKey, isConnected, signAndSendTransaction } = useWalletContext();
  const [timeRemaining, setTimeRemaining] = useState<Record<string, { time: string; date: string; isReady: boolean }>>({});
  const [expandedVote, setExpandedVote] = useState<string | null>(null);
  const [executingVotes, setExecutingVotes] = useState<Set<string>>(new Set());
  const [voteErrors, setVoteErrors] = useState<Record<string, string>>({});
  const [voteSuccesses, setVoteSuccesses] = useState<Record<string, string>>({});

  // Filter votes for this DAO and agent - memoize to prevent infinite loops
  const relevantVotes = useMemo(() => {
    return scheduledVotes.filter(
      v => v.daoAddress === dao.address && 
           v.agentId === agent.id && 
           v.status === "pending"
    );
  }, [scheduledVotes, dao.address, agent.id]);

  // Execute a vote
  const executeVote = useCallback(async (vote: ScheduledVote) => {
    if (!isConnected || !publicKey) {
      setVoteErrors(prev => ({ ...prev, [vote.id]: "Please connect your wallet to execute votes" }));
      return;
    }

    if (!dao.tokenMint) {
      setVoteErrors(prev => ({ ...prev, [vote.id]: "DAO token mint not configured" }));
      return;
    }

    setExecutingVotes(prev => new Set([...prev, vote.id]));
    setVoteErrors(prev => {
      const updated = { ...prev };
      delete updated[vote.id];
      return updated;
    });

    try {
      // Prepare the vote transaction via API
      const response = await fetch("/api/vote/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          realmAddress: dao.address,
          proposalId: vote.proposalId,
          governingTokenMint: dao.tokenMint,
          voterAddress: publicKey.toString(),
          vote: vote.recommendation,
          network: dao.network || "mainnet",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to prepare vote transaction");
      }

      // Decode and send the transaction
      const transactionBuffer = Buffer.from(data.transaction, "base64");
      const transaction = Transaction.from(transactionBuffer);
      
      const signature = await signAndSendTransaction(transaction);
      
      setVoteSuccesses(prev => ({ ...prev, [vote.id]: signature }));
      
      // Notify parent component
      if (onExecuteVote) {
        onExecuteVote(vote.id, signature);
      }
      
      // Clear success message after 10 seconds
      setTimeout(() => {
        setVoteSuccesses(prev => {
          const updated = { ...prev };
          delete updated[vote.id];
          return updated;
        });
      }, 10000);
    } catch (error: any) {
      console.error("Error executing vote:", error);
      setVoteErrors(prev => ({ 
        ...prev, 
        [vote.id]: error.message || "Failed to execute vote" 
      }));
      
      // Clear error after 10 seconds
      setTimeout(() => {
        setVoteErrors(prev => {
          const updated = { ...prev };
          delete updated[vote.id];
          return updated;
        });
      }, 10000);
    } finally {
      setExecutingVotes(prev => {
        const updated = new Set(prev);
        updated.delete(vote.id);
        return updated;
      });
    }
  }, [isConnected, publicKey, dao, signAndSendTransaction, onExecuteVote]);

  // Auto-execute votes that are ready (when auto-vote is enabled)
  useEffect(() => {
    if (!agent.votingPreferences.autoVote || !isConnected) return;

    const readyVotes = relevantVotes.filter(vote => {
      const timer = timeRemaining[vote.id];
      return timer?.isReady && 
             !executingVotes.has(vote.id) && 
             !voteSuccesses[vote.id] &&
             !voteErrors[vote.id];
    });

    // Execute ready votes automatically (with a small delay between each)
    readyVotes.forEach((vote, index) => {
      setTimeout(() => {
        executeVote(vote);
      }, index * 2000); // 2 second delay between votes
    });
  }, [timeRemaining, relevantVotes, agent.votingPreferences.autoVote, isConnected, executeVote, executingVotes, voteSuccesses, voteErrors]);

  // Update countdown timers
  useEffect(() => {
    const updateTimers = () => {
      const now = new Date();
      const newTimeRemaining: Record<string, { time: string; date: string; isReady: boolean }> = {};

      relevantVotes.forEach((vote) => {
        const scheduledTime = new Date(vote.scheduledTime);
        const diff = scheduledTime.getTime() - now.getTime();

        if (diff <= 0) {
          newTimeRemaining[vote.id] = {
            time: "Ready to vote",
            date: scheduledTime.toLocaleDateString(),
            isReady: true,
          };
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          
          let timeStr = "";
          if (days > 0) {
            timeStr = `${days}d ${hours}h`;
          } else if (hours > 0) {
            timeStr = `${hours}h ${minutes}m`;
          } else {
            timeStr = `${minutes}m`;
          }

          newTimeRemaining[vote.id] = {
            time: timeStr,
            date: scheduledTime.toLocaleDateString() + " at " + scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isReady: false,
          };
        }
      });

      setTimeRemaining(newTimeRemaining);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [relevantVotes]);

  if (relevantVotes.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900 border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 flex items-center justify-center border border-purple-500/30">
              <Bot className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{agent.name}</h3>
              <p className="text-sm text-slate-400 flex items-center gap-1">
                {agent.votingPreferences.autoVote ? (
                  <>
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    Auto-Vote Active
                  </>
                ) : (
                  "Manual Mode"
                )}
              </p>
            </div>
          </div>
          {/* Wallet Status */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
            isConnected 
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
          }`}>
            {isConnected ? (
              <>
                <Shield className="w-4 h-4" />
                Wallet Connected
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
                Connect Wallet to Vote
              </>
            )}
          </div>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 text-center">
          <Activity className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No scheduled votes yet</p>
          <p className="text-xs text-slate-500 mt-1">
            {agent.votingPreferences.autoVote 
              ? "Agent will automatically analyze proposals and schedule votes"
              : "Enable auto-vote in agent settings to vote automatically"}
          </p>
        </div>
      </div>
    );
  }

  const yesVotes = relevantVotes.filter(v => v.recommendation === "yes").length;
  const noVotes = relevantVotes.filter(v => v.recommendation === "no").length;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border border-purple-500/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 flex items-center justify-center border border-purple-500/30">
              <Bot className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{agent.name}</h3>
              <p className="text-sm text-slate-400 flex items-center gap-1">
                {agent.votingPreferences.autoVote && (
                  <>
                    <Zap className="w-3.5 h-3.5 text-yellow-400" />
                    Auto-Vote Enabled
                  </>
                )}
                {!agent.votingPreferences.autoVote && "Manual Vote Mode"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Wallet Status */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              isConnected 
                ? "bg-green-500/10 border border-green-500/30 text-green-400"
                : "bg-amber-500/10 border border-amber-500/30 text-amber-400"
            }`}>
              {isConnected ? (
                <>
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Connected</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span className="hidden sm:inline">Connect Wallet</span>
                </>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-400">{relevantVotes.length}</div>
              <div className="text-xs text-slate-400">Scheduled Votes</div>
            </div>
          </div>
        </div>

        {/* Vote Summary */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <ThumbsUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-400">Yes Votes</span>
            </div>
            <div className="text-xl font-bold text-green-400">{yesVotes}</div>
          </div>
          <div className="flex-1 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <ThumbsDown className="w-4 h-4 text-red-400" />
              <span className="text-sm text-slate-400">No Votes</span>
            </div>
            <div className="text-xl font-bold text-red-400">{noVotes}</div>
          </div>
        </div>
      </div>

      {/* Scheduled Votes List */}
      <div className="divide-y divide-purple-500/10 max-h-96 overflow-y-auto">
        {relevantVotes.map((vote) => {
          const timer = timeRemaining[vote.id];
          return (
            <div key={vote.id} className="p-6 hover:bg-slate-900/50 transition-colors">
              <div className="flex items-start gap-4">
                {/* Vote Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  vote.recommendation === "yes" 
                    ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}>
                  {vote.recommendation === "yes" ? (
                    <ThumbsUp className="w-6 h-6" />
                  ) : (
                    <ThumbsDown className="w-6 h-6" />
                  )}
                </div>

                {/* Vote Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{vote.proposalTitle}</h4>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <div className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{timer?.date || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                vote.confidence >= 80 
                                  ? "bg-green-500" 
                                  : vote.confidence >= 60 
                                    ? "bg-yellow-500" 
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${vote.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{vote.confidence}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Timer & Status */}
                    <div className="text-right">
                      <div className={`text-lg font-mono font-bold flex items-center gap-2 ${
                        timer?.isReady 
                          ? "text-green-400" 
                          : "text-purple-400"
                      }`}>
                        {timer?.isReady && <CheckCircle2 className="w-5 h-5" />}
                        {timer?.time || "—"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {timer?.isReady ? "Ready to execute" : "Time remaining"}
                      </div>
                    </div>
                  </div>

                  {/* Reasoning Toggle */}
                  {vote.reasoning && (
                    <button
                      onClick={() => setExpandedVote(expandedVote === vote.id ? null : vote.id)}
                      className="mt-2 text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                    >
                      {expandedVote === vote.id ? "Hide" : "Show"} reasoning
                    </button>
                  )}

                  {/* Expanded Reasoning */}
                  {expandedVote === vote.id && vote.reasoning && (
                    <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                      <p className="text-sm text-slate-300">{vote.reasoning}</p>
                    </div>
                  )}

                  {/* Vote Actions */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {/* Execute Button */}
                    {timer?.isReady && !voteSuccesses[vote.id] && (
                      <button
                        onClick={() => executeVote(vote)}
                        disabled={executingVotes.has(vote.id) || !isConnected}
                        className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                          executingVotes.has(vote.id)
                            ? "bg-purple-500/20 text-purple-400 cursor-wait"
                            : !isConnected
                            ? "bg-slate-700/50 text-slate-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-700 hover:to-fuchsia-700"
                        }`}
                      >
                        {executingVotes.has(vote.id) ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Execute Vote
                          </>
                        )}
                      </button>
                    )}

                    {/* Cancel Button */}
                    {onCancelVote && !voteSuccesses[vote.id] && (
                      <button
                        onClick={() => onCancelVote(vote.id)}
                        disabled={executingVotes.has(vote.id)}
                        className="px-3 py-2 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>

                  {/* Success Message */}
                  {voteSuccesses[vote.id] && (
                    <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Vote executed successfully!</span>
                      </div>
                      <a
                        href={`https://solscan.io/tx/${voteSuccesses[vote.id]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-300 hover:underline mt-1 block font-mono"
                      >
                        View transaction: {voteSuccesses[vote.id].slice(0, 16)}...
                      </a>
                    </div>
                  )}

                  {/* Error Message */}
                  {voteErrors[vote.id] && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{voteErrors[vote.id]}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
