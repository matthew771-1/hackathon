"use client";

import { useState, useEffect } from "react";
import type { AIAgent, ScheduledVote, DAO } from "@/types/dao";
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
  Activity
} from "lucide-react";

interface AIAgentPanelProps {
  agent: AIAgent;
  dao: DAO;
  scheduledVotes: ScheduledVote[];
  onCancelVote?: (voteId: string) => void;
}

export function AIAgentPanel({
  agent,
  dao,
  scheduledVotes,
  onCancelVote,
}: AIAgentPanelProps) {
  const [timeRemaining, setTimeRemaining] = useState<Record<string, { time: string; date: string; isReady: boolean }>>({});
  const [expandedVote, setExpandedVote] = useState<string | null>(null);

  // Filter votes for this DAO and agent
  const relevantVotes = scheduledVotes.filter(
    v => v.daoAddress === dao.address && 
         v.agentId === agent.id && 
         v.status === "pending"
  );

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
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/20 to-fuchsia-600/20 flex items-center justify-center border border-purple-500/30">
            <Bot className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{agent.name}</h3>
            <p className="text-sm text-slate-400">AI Agent Delegated</p>
          </div>
        </div>
        <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 text-center">
          <Activity className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No scheduled votes yet</p>
          <p className="text-xs text-slate-500 mt-1">
            {agent.votingPreferences.autoVote 
              ? "Agent will automatically analyze and vote on new proposals"
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
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-400">{relevantVotes.length}</div>
            <div className="text-xs text-slate-400">Scheduled Votes</div>
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

                  {/* Cancel Button */}
                  {onCancelVote && (
                    <button
                      onClick={() => onCancelVote(vote.id)}
                      className="mt-3 px-3 py-1.5 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel Vote
                    </button>
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
