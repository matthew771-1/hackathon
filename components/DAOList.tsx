"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { DAO } from "@/types/dao";
import { POPULAR_SOLANA_DAOS, fetchDAOInfo } from "@/lib/realms";
import { DAODetail } from "./DAODetail";
import { Building2, FileText, ExternalLink, Plus } from "lucide-react";
import { AddDAOModal } from "./AddDAOModal";

const STORAGE_KEY = "dao-ai-agent-custom-daos";

// Helper functions for localStorage
const saveCustomDAOs = (daos: DAO[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(daos));
    } catch (error) {
      console.error("Error saving custom DAOs to localStorage:", error);
    }
  }
};

const loadCustomDAOs = (): DAO[] => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading custom DAOs from localStorage:", error);
    }
  }
  return [];
};

export function DAOList({ agents }: { agents?: any[] }) {
  const [daos, setDaos] = useState<DAO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDAO, setSelectedDAO] = useState<DAO | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    // Load popular Solana DAOs and custom DAOs
    const loadDAOs = async () => {
      setLoading(true);
      try {
        // Load custom DAOs from localStorage
        const customDAOs = loadCustomDAOs();
        const customDAOAddresses = new Set(customDAOs.map(dao => dao.address));
        
        // Fetch DAO info for each popular Solana DAO (only if not already in custom DAOs)
        const popularDAOsToFetch = POPULAR_SOLANA_DAOS.filter(
          dao => !customDAOAddresses.has(dao.address)
        );
        
        const daoPromises = popularDAOsToFetch.map((dao) => 
          fetchDAOInfo(dao.address).catch((error) => {
            console.error(`Error fetching ${dao.name}:`, error);
            // Return fallback DAO data if fetch fails
            return {
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
              image: dao.image,
            } as DAO;
          })
        );
        const fetchedDAOs = await Promise.all(daoPromises);
        
        // Merge custom DAOs with fetched popular DAOs
        const allDAOs = [...customDAOs, ...fetchedDAOs];
        
        // Filter out nulls and remove duplicates by address
        const uniqueDAOs = allDAOs
          .filter((dao): dao is DAO => dao !== null)
          .filter((dao, index, self) => 
            index === self.findIndex((d) => d.address === dao.address)
          );
        setDaos(uniqueDAOs);
      } catch (error) {
        console.error("Error loading DAOs:", error);
        // Fallback: load custom DAOs and basic popular DAOs
        const customDAOs = loadCustomDAOs();
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
          image: dao.image,
        }));
        // Merge and remove duplicates
        const allDAOs = [...customDAOs, ...fallbackDAOs];
        const uniqueDAOs = allDAOs.filter((dao, index, self) => 
          index === self.findIndex((d) => d.address === dao.address)
        );
        setDaos(uniqueDAOs);
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

  const handleAddDAO = async (daoData: Omit<DAO, "treasury" | "memberCount" | "proposalCount">) => {
    const { getRealmFromGovernance, registerDynamicDAO, fetchDAOInfo } = await import("@/lib/realms");
    
    // If realm address is provided directly, use it
    let realmAddress: string | null = daoData.address || daoData.realm || null;
    
    // If no realm address provided, try to get it from governance addresses
    if (!realmAddress) {
      if (!daoData.governanceAddresses || daoData.governanceAddresses.length === 0) {
        alert("Please provide either a realm address or at least one governance address.");
        return;
      }
      
      // Try each governance address until we find a valid one
      const network = daoData.network || "mainnet";
      
      for (const govAddress of daoData.governanceAddresses) {
        console.log(`Trying governance address: ${govAddress}`);
        realmAddress = await getRealmFromGovernance(govAddress, network);
        if (realmAddress) {
          console.log(`✅ Found realm address ${realmAddress} from governance ${govAddress}`);
          break;
        }
      }
      
      if (!realmAddress) {
        alert(`Could not find realm address from any of the provided governance accounts. Please verify the governance addresses are correct and belong to the SPL Governance program, or provide the realm address directly.`);
        return;
      }
    } else {
      console.log(`Using provided realm address: ${realmAddress}`);
    }
    
    // Check if DAO already exists to prevent duplicates
    const existingDAO = daos.find(dao => dao.address === realmAddress);
    if (existingDAO) {
      alert(`This DAO (${existingDAO.name}) is already in the list.`);
      return;
    }
    
    // Register the DAO with the actual realm address
    registerDynamicDAO(realmAddress, {
      governanceAddresses: daoData.governanceAddresses,
      network: daoData.network,
    });
    
    // Fetch the DAO info using the actual realm address
    try {
      const fullDAO = await fetchDAOInfo(realmAddress);
      // Preserve governance addresses from form data
      const daoWithGovernance: DAO = {
        ...fullDAO,
        address: realmAddress, // Use the actual realm address
        realm: realmAddress,
        governanceAddresses: daoData.governanceAddresses,
      };
      setDaos((prev) => {
        const updated = [...prev, daoWithGovernance];
        // Save custom DAOs to localStorage (exclude popular DAOs)
        const popularDAOAddresses = new Set<string>(POPULAR_SOLANA_DAOS.map(d => d.address));
        const customDAOs = updated.filter(dao => !popularDAOAddresses.has(dao.address));
        saveCustomDAOs(customDAOs);
        return updated;
      });
    } catch (error) {
      console.error("Error fetching new DAO info:", error);
      // Add with default values if fetch fails
      const newDAO: DAO = {
        ...daoData,
        address: realmAddress, // Use the actual realm address
        realm: realmAddress,
        treasury: 0,
        memberCount: 0,
        proposalCount: 0,
      };
      setDaos((prev) => {
        const updated = [...prev, newDAO];
        // Save custom DAOs to localStorage (exclude popular DAOs)
        const popularDAOAddresses = new Set<string>(POPULAR_SOLANA_DAOS.map(d => d.address));
        const customDAOs = updated.filter(dao => !popularDAOAddresses.has(dao.address));
        saveCustomDAOs(customDAOs);
        return updated;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          Available DAOs
        </h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          Add DAO
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {daos.map((dao) => (
          <div
            key={dao.address}
            className="p-6 border border-slate-800 rounded-xl hover:border-purple-500/50 transition-all bg-slate-900/50 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                {dao.image && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                    <Image
                      src={dao.image}
                      alt={dao.name}
                      width={40}
                      height={40}
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <h3 className="text-xl font-semibold text-white">{dao.name}</h3>
              </div>
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

      <AddDAOModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddDAO}
      />
    </div>
  );
}

