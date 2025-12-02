"use client";

import { useState, useEffect } from "react";
import type { DAO } from "@/types/dao";
import { POPULAR_SOLANA_DAOS, fetchDAOInfo } from "@/lib/realms";
import { DAODetail } from "./DAODetail";

export function DAOList({ agents }: { agents?: any[] }) {
  const [daos, setDaos] = useState<DAO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDAO, setSelectedDAO] = useState<DAO | null>(null);

  useEffect(() => {
    // Load popular Solana DAOs
    const loadDAOs = async () => {
      setLoading(true);
      try {
        // Fetch DAO info for each popular Solana DAO
        const daoPromises = POPULAR_SOLANA_DAOS.map((dao) => fetchDAOInfo(dao.address));
        const fetchedDAOs = await Promise.all(daoPromises);
        setDaos(fetchedDAOs);
      } catch (error) {
        console.error("Error loading DAOs:", error);
        // Fallback to basic data if fetch fails
        const fallbackDAOs: DAO[] = POPULAR_SOLANA_DAOS.map((dao) => ({
          name: dao.name,
          address: dao.address,
          realm: dao.address,
          treasury: 0,
          memberCount: 0,
          proposalCount: 0,
          description: dao.description,
          website: dao.website,
          token: dao.token,
          network: dao.network,
        }));
        setDaos(fallbackDAOs);
      } finally {
        setLoading(false);
      }
    };

    loadDAOs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Available DAOs</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {daos.map((dao) => (
          <div
            key={dao.address}
            className="p-6 border rounded-lg hover:border-purple-500 transition-colors bg-white dark:bg-gray-800"
          >
            <h3 className="text-xl font-semibold mb-2">{dao.name}</h3>
            {dao.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{dao.description}</p>
            )}
            {dao.token && (
              <div className="mb-2">
                <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded">
                  {dao.token}
                </span>
              </div>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Treasury:</span>
                <span className="font-medium">${dao.treasury.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Members:</span>
                <span className="font-medium">{dao.memberCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Proposals:</span>
                <span className="font-medium">{dao.proposalCount}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedDAO(dao)}
              className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              View DAO
            </button>
          </div>
        ))}
      </div>

      {selectedDAO && (
        <DAODetail
          dao={selectedDAO}
          agents={agents || []}
          onClose={() => setSelectedDAO(null)}
        />
      )}
    </div>
  );
}

