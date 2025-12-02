"use client";

import { useState, useEffect } from "react";
import type { DAO } from "@/types/dao";
import { POPULAR_SOLANA_DAOS, fetchDAOInfo } from "@/lib/realms";
import { DAODetail } from "./DAODetail";
import { Building2, Users, FileText, Wallet, ExternalLink } from "lucide-react";

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
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        <Building2 className="w-6 h-6" />
        Available DAOs
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {daos.map((dao) => (
          <div
            key={dao.address}
            className="p-6 border border-slate-800 rounded-xl hover:border-purple-500/50 transition-all bg-slate-900/50 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-xl font-semibold text-white">{dao.name}</h3>
              <Building2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
            </div>
            {dao.description && (
              <p className="text-sm text-slate-400 mb-4 line-clamp-2">{dao.description}</p>
            )}
            {dao.token && (
              <div className="mb-4">
                <span className="text-xs px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  {dao.token}
                </span>
              </div>
            )}
            <div className="space-y-2.5 text-sm mb-4 p-3 bg-slate-950/50 rounded-lg border border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" />
                  Treasury:
                </span>
                <span className="font-medium text-slate-300">${dao.treasury.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Members:
                </span>
                <span className="font-medium text-slate-300">{dao.memberCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Proposals:
                </span>
                <span className="font-medium text-slate-300">{dao.proposalCount}</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedDAO(dao)}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
            >
              <ExternalLink className="w-4 h-4" />
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

