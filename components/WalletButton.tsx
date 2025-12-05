"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Wallet, ChevronDown } from "lucide-react";
import { useWalletContext } from "./WalletProvider";

export function WalletButton() {
  const { publicKey, isConnected, connect, disconnect, availableWallets } = useWalletContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleWalletConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to connect:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to connect wallet. Please try again.";
      alert(errorMessage);
    }
  };

  const handleWalletDisconnect = async () => {
    try {
      await disconnect();
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  // Default wallets to show (even if not installed)
  const defaultWallets = [
    {
      name: "Phantom",
      icon: "https://yt3.googleusercontent.com/0yNbMsS0-rUrtVJmKd6d0xTDmLDEn1qu_KkivaeIC3UmCuXntxE-CJZRhWoy93JXij1YSJFMhA=s900-c-k-c0x00ffffff-no-rj",
      installed: availableWallets.some(w => w.name === "Phantom"),
    },
    {
      name: "Jupiter",
      icon: "https://jup.ag/favicon.ico",
      installed: availableWallets.some(w => w.name === "Jupiter"),
    },
    {
      name: "Solflare",
      icon: "https://solflare.com/favicon.ico",
      installed: availableWallets.some(w => w.name === "Solflare"),
    },
    {
      name: "Backpack",
      icon: "https://www.backpack.app/favicon.ico",
      installed: availableWallets.some(w => w.name === "Backpack"),
    },
  ];

  return (
    <>
      {/* Main Button */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-purple-500/20 hover:scale-105 hover:from-purple-700 hover:to-fuchsia-700"
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">
            {isConnected && publicKey ? `Connected (${formatAddress(publicKey.toString())})` : "Connect Wallet"}
          </span>
          <span className="sm:hidden">
            {isConnected ? "Connected" : "Connect"}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown Modal */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Wallet Options Modal */}
            <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-sm border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 space-y-3">
                {defaultWallets.map((wallet) => {
                  const installedWallet = availableWallets.find(w => w.name === wallet.name);
                  const isWalletConnected = isConnected && installedWallet !== undefined;
                  
                  return (
                    <button
                      key={wallet.name}
                      onClick={() => isWalletConnected ? handleWalletDisconnect() : handleWalletConnect(wallet.name)}
                      disabled={!wallet.installed && !isWalletConnected}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg transition-all border ${
                        isWalletConnected
                          ? "bg-green-500/10 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50"
                          : !wallet.installed
                          ? "bg-slate-900/30 border-slate-800/50 opacity-60 cursor-not-allowed"
                          : "bg-slate-900/50 border-slate-800 hover:bg-slate-800/50 hover:border-purple-500/50"
                      }`}
                    >
                      {wallet.icon && (
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
                          <Image
                            src={wallet.icon}
                            alt={wallet.name}
                            width={48}
                            height={48}
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-white text-base">{wallet.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {isWalletConnected && publicKey
                            ? `Connected (${formatAddress(publicKey.toString())})`
                            : !wallet.installed
                            ? "Not installed"
                            : "Click to connect"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
