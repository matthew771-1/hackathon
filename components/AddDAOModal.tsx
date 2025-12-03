"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { DAO } from "@/types/dao";

interface AddDAOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (dao: Omit<DAO, "treasury" | "memberCount" | "proposalCount">) => void;
}

export function AddDAOModal({ isOpen, onClose, onAdd }: AddDAOModalProps) {
  const [formData, setFormData] = useState({
    realmAddress: "", // Optional realm address
    network: "mainnet" as "mainnet" | "devnet",
    governanceAddresses: [""], // Start with one empty slot
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty governance addresses
    const validGovernanceAddresses = formData.governanceAddresses
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);
    
    const realmAddress = formData.realmAddress.trim();
    
    if (validGovernanceAddresses.length === 0 && !realmAddress) {
      alert("Please provide either a realm address or at least one governance account address.");
      return;
    }
    
    // If realm address is provided, use it directly
    // Otherwise, use the first governance address as a temporary identifier
    const tempAddress = realmAddress || validGovernanceAddresses[0];
    
    onAdd({
      name: realmAddress ? `DAO ${realmAddress.slice(0, 8)}...` : `DAO ${tempAddress.slice(0, 8)}...`,
      address: tempAddress, // Will be replaced with actual realm address if not provided
      realm: tempAddress,
      network: formData.network,
      governanceAddresses: validGovernanceAddresses.length > 0 ? validGovernanceAddresses : undefined,
    });

    // Reset form
    setFormData({
      realmAddress: "",
      network: "mainnet",
      governanceAddresses: [""],
    });
    onClose();
  };

  const addGovernanceSlot = () => {
    setFormData({
      ...formData,
      governanceAddresses: [...formData.governanceAddresses, ""],
    });
  };

  const updateGovernanceAddress = (index: number, value: string) => {
    const newAddresses = [...formData.governanceAddresses];
    newAddresses[index] = value;
    setFormData({
      ...formData,
      governanceAddresses: newAddresses,
    });
  };

  const removeGovernanceSlot = (index: number) => {
    if (formData.governanceAddresses.length > 1) {
      const newAddresses = formData.governanceAddresses.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        governanceAddresses: newAddresses,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Plus className="w-6 h-6" />
            Add New DAO
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Realm Address (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              DAO Realm Address <span className="text-slate-500 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              value={formData.realmAddress}
              onChange={(e) => setFormData({ ...formData, realmAddress: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-mono text-sm"
              placeholder="4ct8XU5tKbMNRphWy4rePsS9kBqPhDdvZoGpmprPaug4"
            />
            <p className="mt-1 text-xs text-slate-500">
              If you know the realm address, enter it here. Otherwise, provide governance addresses below.
            </p>
          </div>

          {/* Governance Addresses */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Governance Account Addresses <span className="text-slate-500 text-xs">(Optional if realm address provided)</span>
            </label>
            <div className="space-y-2">
              {formData.governanceAddresses.map((address, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    required={index === 0}
                    value={address}
                    onChange={(e) => updateGovernanceAddress(index, e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-mono text-sm"
                    placeholder={`Governance address ${index + 1}`}
                  />
                  {formData.governanceAddresses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGovernanceSlot(index)}
                      className="px-3 py-2.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addGovernanceSlot}
                className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Governance Address
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Provide governance account addresses if you do not have the realm address. The realm will be automatically discovered from valid governance accounts.
            </p>
          </div>

          {/* Network */}
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">
              Network
            </label>
            <select
              value={formData.network}
              onChange={(e) => setFormData({ ...formData, network: e.target.value as "mainnet" | "devnet" })}
              className="w-full px-4 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            >
              <option value="mainnet">Mainnet</option>
              <option value="devnet">Devnet</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all"
            >
              Add DAO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

