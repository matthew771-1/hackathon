"use client";

import { useState, useEffect, useRef } from "react";
import type { AIAgent } from "@/types/dao";
import { Eye, Brain, Vote, CheckCircle, Clock, Activity } from "lucide-react";

export interface ActivityItem {
  id: string;
  type: "monitoring" | "analyzing" | "voting" | "completed";
  proposalId?: string;
  proposalTitle?: string;
  timestamp: Date;
  status: "pending" | "in_progress" | "completed" | "failed";
  message: string;
}

interface AgentActivityProps {
  agent: AIAgent;
  daoAddress: string;
  onActivityUpdate?: (activity: ActivityItem) => void;
}

export function AgentActivity({
  agent,
  daoAddress,
  onActivityUpdate,
}: AgentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const hasInitialized = useRef(false);
  const onActivityUpdateRef = useRef(onActivityUpdate);
  
  // Keep the ref updated
  onActivityUpdateRef.current = onActivityUpdate;

  useEffect(() => {
    // Only run once per agent/dao combination
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Add initial activity
    const initialActivity: ActivityItem = {
      id: `activity-${Date.now()}`,
      type: "monitoring",
      status: "completed",
      message: `${agent.name} is now monitoring this DAO for new proposals...`,
      timestamp: new Date(),
    };
    
    setActivities([initialActivity]);
    onActivityUpdateRef.current?.(initialActivity);

    // Reset on unmount
    return () => {
      hasInitialized.current = false;
    };
  }, [agent.id, daoAddress, agent.name]);

  // Expose a method to add activities from parent
  const addActivity = (activity: Omit<ActivityItem, "id" | "timestamp">) => {
    const newActivity: ActivityItem = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setActivities((prev) => [newActivity, ...prev].slice(0, 10)); // Keep last 10 activities
    onActivityUpdateRef.current?.(newActivity);
  };

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "monitoring":
        return <Eye className="w-4 h-4" />;
      case "analyzing":
        return <Brain className="w-4 h-4" />;
      case "voting":
        return <Vote className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusStyle = (status: ActivityItem["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "in_progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "failed":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  if (activities.length === 0) {
    return (
      <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-4 h-4 animate-pulse" />
          <span className="text-sm">{agent.name} is initializing...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
        <Activity className="w-4 h-4 text-purple-400" />
        <h3 className="font-semibold text-white text-sm">Agent Activity</h3>
        <span className="text-xs text-slate-500">({agent.name})</span>
      </div>
      
      <div className="max-h-48 overflow-y-auto">
        {activities.map((activity, index) => (
          <div
            key={activity.id}
            className={`flex items-start gap-3 px-4 py-3 ${
              index !== activities.length - 1 ? "border-b border-slate-700/50" : ""
            }`}
          >
            <div className={`p-1.5 rounded ${getStatusStyle(activity.status)}`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300 leading-tight">
                {activity.message}
              </p>
              {activity.proposalTitle && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {activity.proposalTitle}
                </p>
              )}
            </div>
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
