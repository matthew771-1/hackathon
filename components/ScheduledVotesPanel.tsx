"use client";

import { useState, useEffect } from "react";
import type { ScheduledVote } from "@/types/dao";
import { 
  Clock, 
  Bot, 
  ThumbsUp, 
  ThumbsDown, 
  X, 
  Timer,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ScheduledVotesPanelProps {
  scheduledVotes: ScheduledVote[];
  onCancelVote: (voteId: string) => void;
}

export function ScheduledVotesPanel({ 
  scheduledVotes, 
  onCancelVote
}: ScheduledVotesPanelProps) {
  const [expandedVote, setExpandedVote] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({});

  // Update countdown timers
  useEffect(() => {
    const updateTimers = () => {
      const now = new Date();
      const newTimeRemaining: Record<string, string> = {};

      scheduledVotes.forEach((vote) => {
        if (vote.status !== "pending") return;

        const scheduledTime = new Date(vote.scheduledTime);
        const diff = scheduledTime.getTime() - now.getTime();

        if (diff <= 0) {
          newTimeRemaining[vote.id] = "Ready";
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          
          if (minutes > 0) {
            newTimeRemaining[vote.id] = `${minutes}m ${seconds}s`;
          } else {
            newTimeRemaining[vote.id] = `${seconds}s`;
          }
        }
      });

      setTimeRemaining(newTimeRemaining);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [scheduledVotes]);

  const pendingVotes = scheduledVotes.filter(v => v.status === "pending");

  if (pendingVotes.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-900/30 via-fuchsia-900/20 to-purple-900/30 border border-purple-500/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-purple-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Timer className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Scheduled AI Votes</h3>
            <p className="text-sm text-purple-300/70">
              {pendingVotes.length} vote{pendingVotes.length !== 1 ? "s" : ""} scheduled
            </p>
          </div>
        </div>
      </div>

      {/* Votes List */}
      <div className="divide-y divide-purple-500/10">
        {pendingVotes.map((vote) => (
          <div key={vote.id} className="px-6 py-4">
            <div className="flex items-start gap-4">
              {/* Vote Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                vote.recommendation === "yes" 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-red-500/20 text-red-400"
              }`}>
                {vote.recommendation === "yes" ? (
                  <ThumbsUp className="w-6 h-6" />
                ) : (
                  <ThumbsDown className="w-6 h-6" />
                )}
              </div>

              {/* Vote Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">{vote.proposalTitle}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                      {vote.agentName && (
                        <>
                          <span className="flex items-center gap-1">
                            <Bot className="w-3.5 h-3.5" />
                            {vote.agentName}
                          </span>
                          {vote.daoName && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span>{vote.daoName}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Timer & Actions */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-lg font-mono font-bold ${
                        timeRemaining[vote.id] === "Ready" 
                          ? "text-green-400 animate-pulse" 
                          : "text-purple-400"
                      }`}>
                        {timeRemaining[vote.id] || "—"}
                      </div>
                      <div className="text-xs text-slate-500">until vote</div>
                    </div>
                    
                    <button
                      onClick={() => onCancelVote(vote.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Cancel scheduled vote"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Confidence & Expand */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 bg-slate-700 rounded-full overflow-hidden">
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
                    <span className="text-sm text-slate-400">{vote.confidence}% confident</span>
                  </div>

                  {vote.reasoning && (
                    <button
                      onClick={() => setExpandedVote(expandedVote === vote.id ? null : vote.id)}
                      className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {expandedVote === vote.id ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Hide reasoning
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show reasoning
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded Reasoning */}
                {expandedVote === vote.id && vote.reasoning && (
                  <div className="mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                    <p className="text-sm text-slate-300">{vote.reasoning}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

