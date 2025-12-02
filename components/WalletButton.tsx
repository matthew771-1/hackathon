"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { PublicKey } from "@solana/web3.js";
import { Wallet, ChevronDown } from "lucide-react";
import { useWallets } from "@wallet-standard/react";

interface WindowWallet {
  name: string;
  icon?: string;
  provider: any;
  connect: () => Promise<{ publicKey: PublicKey }>;
}

export function WalletButton() {
  const standardWallets = useWallets();
  const [windowWallets, setWindowWallets] = useState<WindowWallet[]>([]);
  const [connectedWindowWallet, setConnectedWindowWallet] = useState<WindowWallet | null>(null);
  const [windowPublicKey, setWindowPublicKey] = useState<PublicKey | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Detect window-injected wallets (Phantom, Solflare, Backpack)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const detectedWallets: WindowWallet[] = [];

    // Detect Phantom
    if (window.solana && (window.solana as any).isPhantom) {
      // Use a reliable Phantom icon URL
      const phantomIcon = "https://yt3.googleusercontent.com/0yNbMsS0-rUrtVJmKd6d0xTDmLDEn1qu_KkivaeIC3UmCuXntxE-CJZRhWoy93JXij1YSJFMhA=s900-c-k-c0x00ffffff-no-rj";
      detectedWallets.push({
        name: "Phantom",
        icon: phantomIcon,
        provider: window.solana,
        connect: async () => {
          const response = await window.solana!.connect!();
          return { publicKey: new PublicKey(response.publicKey.toString()) };
        },
      });
    }

    // Detect Jupiter - check multiple possible locations
    // Jupiter might be in window.jupiter, window.solana (if it's the active wallet), or via Wallet Standard
    if ((window as any).jupiter) {
      const jupiter = (window as any).jupiter;
      detectedWallets.push({
        name: "Jupiter",
        icon: "https://jup.ag/favicon.ico",
        provider: jupiter,
        connect: async () => {
          const response = await jupiter.connect();
          return { publicKey: new PublicKey(response.publicKey.toString()) };
        },
      });
    } else if (window.solana && !(window.solana as any).isPhantom) {
      // Check if solana exists but isn't Phantom - might be Jupiter or another wallet
      // Try to detect Jupiter by checking if it has Jupiter-specific properties
      const solanaProvider = window.solana as any;
      if (solanaProvider.name?.toLowerCase().includes('jupiter') || 
          (window as any).__JUPITER_WALLET__) {
        detectedWallets.push({
          name: "Jupiter",
          icon: "https://jup.ag/favicon.ico",
          provider: solanaProvider,
          connect: async () => {
            const response = await solanaProvider.connect();
            return { publicKey: new PublicKey(response.publicKey.toString()) };
          },
        });
      }
    }

    // Detect Solflare
    if (window.solflare) {
      const solflare = window.solflare;
      detectedWallets.push({
        name: "Solflare",
        icon: "https://solflare.com/favicon.ico",
        provider: solflare,
        connect: async () => {
          const response = await solflare.connect();
          return { publicKey: new PublicKey(response.publicKey.toString()) };
        },
      });
    }

    // Detect Backpack
    if (window.backpack) {
      const backpack = window.backpack;
      detectedWallets.push({
        name: "Backpack",
        icon: "https://www.backpack.app/favicon.ico",
        provider: backpack,
        connect: async () => {
          const response = await backpack.connect();
          return { publicKey: new PublicKey(response.publicKey.toString()) };
        },
      });
    }

    setWindowWallets(detectedWallets);
  }, []);

  // Check for Jupiter in Wallet Standard wallets
  const jupiterStandardWallet = standardWallets.find(
    (w) => w.name.toLowerCase().includes("jupiter")
  );

  // Always show Phantom and Jupiter, even if not detected
  const phantomWallet = windowWallets.find(w => w.name === "Phantom");
  const jupiterWindowWallet = windowWallets.find(w => w.name === "Jupiter");
  
  // Create Jupiter wallet from standard wallet if found
  const jupiterWallet: WindowWallet = jupiterWindowWallet || (jupiterStandardWallet ? {
    name: "Jupiter",
    icon: (jupiterStandardWallet as any).icon || "https://jup.ag/favicon.ico",
    provider: jupiterStandardWallet,
    connect: async () => {
      // Use Wallet Standard connect
      const connectFeature = (jupiterStandardWallet as any).features?.["standard:connect"];
      if (connectFeature && typeof connectFeature.connect === "function") {
        await connectFeature.connect();
        // Wait a moment for accounts to update, then check
        await new Promise(resolve => setTimeout(resolve, 200));
        // Check accounts again after connection
        if (jupiterStandardWallet.accounts && jupiterStandardWallet.accounts.length > 0) {
          return { publicKey: new PublicKey(jupiterStandardWallet.accounts[0].address) };
        }
        // If still no accounts, try to get from the provider directly
        const provider = (jupiterStandardWallet as any).provider;
        if (provider && provider.publicKey) {
          return { publicKey: new PublicKey(provider.publicKey.toString()) };
        }
      }
      throw new Error("Failed to connect Jupiter wallet");
    },
  } : {
    name: "Jupiter",
    icon: "https://jup.ag/favicon.ico",
    provider: null,
    connect: async () => {
      throw new Error("Jupiter wallet not detected. Please install the Jupiter extension.");
    },
  });
  
  // Create default wallets if not detected
  const availableWallets: WindowWallet[] = [
    phantomWallet || {
      name: "Phantom",
      icon: "https://yt3.googleusercontent.com/0yNbMsS0-rUrtVJmKd6d0xTDmLDEn1qu_KkivaeIC3UmCuXntxE-CJZRhWoy93JXij1YSJFMhA=s900-c-k-c0x00ffffff-no-rj",
      provider: null,
      connect: async () => {
        throw new Error("Phantom wallet not detected. Please install the Phantom extension.");
      },
    },
    jupiterWallet,
  ];

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

  const handleWalletConnect = async (wallet: WindowWallet) => {
    try {
      if (!wallet.provider) {
        alert(`${wallet.name} wallet not detected. Please install the ${wallet.name} extension.`);
        return;
      }
      const { publicKey } = await wallet.connect();
      setConnectedWindowWallet(wallet);
      setWindowPublicKey(publicKey);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to connect:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to connect wallet. Please try again.";
      alert(errorMessage);
    }
  };

  const handleWalletDisconnect = async () => {
    try {
      if (connectedWindowWallet?.provider?.disconnect) {
        await connectedWindowWallet.provider.disconnect();
      }
      setConnectedWindowWallet(null);
      setWindowPublicKey(null);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  const isConnected = connectedWindowWallet !== null && windowPublicKey !== null;

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
            {isConnected ? `Connected (${formatAddress(windowPublicKey!.toString())})` : "Connect Wallet"}
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
            <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 space-y-3">
                {availableWallets.length > 0 ? (
                  availableWallets.map((wallet) => {
                    const isWalletConnected = connectedWindowWallet?.name === wallet.name && windowPublicKey !== null;
                    return (
                      <button
                        key={wallet.name}
                        onClick={() => isWalletConnected ? handleWalletDisconnect() : handleWalletConnect(wallet)}
                        disabled={!wallet.provider && !isWalletConnected}
                        className={`w-full flex items-center gap-3 p-4 rounded-lg transition-all border ${
                          isWalletConnected
                            ? "bg-green-500/10 border-green-500/30 hover:bg-green-500/20 hover:border-green-500/50"
                            : !wallet.provider
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
                            {isWalletConnected && windowPublicKey
                              ? `Connected (${formatAddress(windowPublicKey.toString())})`
                              : !wallet.provider
                              ? "Not installed"
                              : "Click to connect"}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-slate-400">
                      No wallets detected. Please install Phantom or Jupiter wallet extension.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}


