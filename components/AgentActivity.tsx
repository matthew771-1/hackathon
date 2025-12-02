"use client";

import { useState, useEffect } from "react";
import type { AIAgent } from "@/types/dao";
import type { Proposal } from "@/types/dao";

export interface Activity {
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
  onActivityUpdate?: (activity: Activity) => void;
}

export function AgentActivity({
  agent,
  daoAddress,
  onActivityUpdate,
}: AgentActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Add activity helper
    const addActivity = (activity: Omit<Activity, "id" | "timestamp">) => {
      const newActivity: Activity = {
        ...activity,
        id: `activity-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      };
      setActivities((prev) => [newActivity, ...prev].slice(0, 20)); // Keep last 20 activities
      if (onActivityUpdate) {
        onActivityUpdate(newActivity);
      }
    };

    // Initial activity
    addActivity({
      type: "monitoring",
      status: "completed",
      message: `${agent.name} is now monitoring this DAO for new proposals...`,
    });

    // Simulate agent activity - monitoring proposals
    const interval = setInterval(() => {
      addActivity({
        type: "monitoring",
        status: "completed",
        message: "Scanning DAO for new proposals and updates...",
      });
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [daoAddress, agent.id, agent.name, onActivityUpdate]);

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "monitoring":
        return "👁️";
      case "analyzing":
        return "🤔";
      case "voting":
        return "🗳️";
      case "completed":
        return "✅";
      default:
        return "📋";
    }
  };

  const getActivityColor = (status: Activity["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600 dark:text-green-400";
      case "in_progress":
        return "text-blue-600 dark:text-blue-400";
      case "failed":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  if (activities.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-white dark:bg-gray-800">
        <h3 className="font-semibold mb-2">Agent Activity</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {agent.name} is monitoring this DAO for new proposals...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-gray-800">
      <h3 className="font-semibold mb-4">Agent Activity: {agent.name}</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
          >
            <span className="text-2xl">{getActivityIcon(activity.type)}</span>
            <div className="flex-1">
              <p className={`text-sm font-medium ${getActivityColor(activity.status)}`}>
                {activity.message}
              </p>
              {activity.proposalTitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Proposal: {activity.proposalTitle}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {activity.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <span
              className={`px-2 py-1 text-xs rounded ${
                activity.status === "completed"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                  : activity.status === "in_progress"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {activity.status.replace("_", " ")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

