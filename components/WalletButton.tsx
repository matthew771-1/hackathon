"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { PublicKey } from "@solana/web3.js";
import { Wallet, ChevronDown } from "lucide-react";
import { useWallets } from "@wallet-standard/react";
import { StandardConnect } from "@wallet-standard/core";

interface WindowWallet {
  name: string;
  icon?: string;
  provider: any;
  connect: () => Promise<{ publicKey: PublicKey }>;
}

export function WalletButton() {
  const standardWallets = useWallets();
  const [windowWallets, setWindowWallets] = useState<WindowWallet[]>([]);
  const [jupiterProvider, setJupiterProvider] = useState<any>(null);
  const [connectedWindowWallet, setConnectedWindowWallet] = useState<WindowWallet | null>(null);
  const [windowPublicKey, setWindowPublicKey] = useState<PublicKey | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Detect window-injected wallets
  useEffect(() => {
    if (typeof window === "undefined") return;

    const detectedWallets: WindowWallet[] = [];

    if (window.solana && (window.solana as any).isPhantom) {
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
    } else if (window.solana) {
      // window.solana exists but is not Phantom - could be Jupiter or another wallet
      const solanaProvider = window.solana as any;
      const providerName = solanaProvider.name || solanaProvider.providerName || '';
      const isJupiter = providerName.toLowerCase().includes('jupiter') || 
                       solanaProvider._jupiter ||
                       (window as any).__JUPITER_WALLET__;
      
      if (isJupiter) {
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

    if (window.solflare) {
      detectedWallets.push({
        name: "Solflare",
        icon: "https://solflare.com/favicon.ico",
        provider: window.solflare,
        connect: async () => {
          const response = await window.solflare!.connect();
          return { publicKey: new PublicKey(response.publicKey.toString()) };
        },
      });
    }

    if (window.backpack) {
      detectedWallets.push({
        name: "Backpack",
        icon: "https://www.backpack.app/favicon.ico",
        provider: window.backpack,
        connect: async () => {
          const response = await window.backpack!.connect();
          return { publicKey: new PublicKey(response.publicKey.toString()) };
        },
      });
    }

    setWindowWallets(detectedWallets);
  }, []);

  // Poll for Jupiter wallet
  useEffect(() => {
    const detectJupiter = async () => {
      if (window.solana && !(window.solana as any).isPhantom) {
        const solanaProvider = window.solana as any;
        const providerName = solanaProvider.name || solanaProvider.providerName || '';
        if (providerName.toLowerCase().includes('jupiter')) {
          setJupiterProvider(solanaProvider);
          return;
        }
      }
      
      for (let i = 0; i < 10; i++) {
        const provider = (window as any).jup || (window as any).jupiter || (window as any).jupiterWallet;
        
        if (provider) {
          setJupiterProvider(provider);
          break;
        }
        
        await new Promise(res => setTimeout(res, 300));
      }
    };

    detectJupiter();
  }, []);

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
      
      let publicKey: PublicKey;
      try {
        const result = await wallet.connect();
        publicKey = result.publicKey;
        
        // Check for placeholder public key (means connection is pending)
        if (publicKey.toString() === "11111111111111111111111111111111") {
          // Connection pending - set wallet and wait for accounts
          setConnectedWindowWallet(wallet);
          setIsOpen(false);
          return;
        }
      } catch (connectError: any) {
        if (connectError.message && connectError.message.includes("accounts not immediately available")) {
          if (wallet.provider && typeof wallet.provider === 'object') {
            const walletAny = wallet.provider as any;
            if (walletAny.accounts && Array.isArray(walletAny.accounts) && walletAny.accounts.length > 0) {
              publicKey = new PublicKey(walletAny.accounts[0].address);
            } else {
              setConnectedWindowWallet(wallet);
              setIsOpen(false);
              return;
            }
          } else {
            throw connectError;
          }
        } else {
          throw connectError;
        }
      }
      
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

  // Get Jupiter wallet - check Wallet Standard wallets first
  const getJupiterWallet = (): WindowWallet | null => {
    // Look for Jupiter in Wallet Standard wallets
    const jupiterStandardWallet = standardWallets.find(
      w => {
        const name = w.name.toLowerCase();
        return name.includes("jupiter") || name.includes("jup");
      }
    );
    
    if (jupiterStandardWallet) {
      return {
        name: "Jupiter",
        icon: (jupiterStandardWallet as any).icon || "https://jup.ag/favicon.ico",
        provider: jupiterStandardWallet,
        connect: async () => {
          // Find the wallet fresh to ensure we have a valid handle
          const freshJupiterWallet = standardWallets.find(
            w => {
              const name = w.name.toLowerCase();
              return (name.includes("jupiter") || name.includes("jup")) && 
                     w.features.includes(StandardConnect);
            }
          );
          
          if (!freshJupiterWallet) {
            throw new Error("Jupiter wallet not found or no longer available");
          }
          
          // Check if already connected
          if (freshJupiterWallet.accounts && freshJupiterWallet.accounts.length > 0) {
            return { publicKey: new PublicKey(freshJupiterWallet.accounts[0].address) };
          }

          // Use the standard:connect feature directly
          const walletAny = freshJupiterWallet as any;
          const connectFeature = walletAny.features?.[StandardConnect] || 
                                walletAny.features?.["standard:connect"];
          
          if (connectFeature && typeof connectFeature.connect === 'function') {
            try {
              const result = await connectFeature.connect();
              
              // Check if we got accounts from the connect call
              if (result && result.accounts && result.accounts.length > 0) {
                return { publicKey: new PublicKey(result.accounts[0].address) };
              }
              
              // Accounts might be on the wallet object now
              if (freshJupiterWallet.accounts && freshJupiterWallet.accounts.length > 0) {
                return { publicKey: new PublicKey(freshJupiterWallet.accounts[0].address) };
              }
            } catch (err) {
              console.warn("standard:connect failed:", err);
            }
          }

          // Try direct connect methods
          try {
            if (typeof walletAny.connect === 'function') {
              const result = await walletAny.connect();
              if (result?.publicKey) {
                return { publicKey: new PublicKey(result.publicKey.toString()) };
              }
            } else if (walletAny.provider && typeof walletAny.provider.connect === 'function') {
              const result = await walletAny.provider.connect();
              if (result?.publicKey) {
                return { publicKey: new PublicKey(result.publicKey.toString()) };
              }
            }
          } catch (err) {
            console.warn("Direct connect failed, but continuing:", err);
          }
          
          // Quick check for accounts (reduced polling)
          for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 50));
            
            if (freshJupiterWallet.accounts && freshJupiterWallet.accounts.length > 0) {
              return { publicKey: new PublicKey(freshJupiterWallet.accounts[0].address) };
            }
          }
          
          // Try various ways to get the public key
          if (walletAny.provider?.publicKey) {
            return { publicKey: new PublicKey(walletAny.provider.publicKey.toString()) };
          }
          
          if (walletAny.publicKey) {
            return { publicKey: new PublicKey(walletAny.publicKey.toString()) };
          }
          
          // Return placeholder - wallet state will update on re-render
          throw new Error("accounts not immediately available");
        },
      };
    }

    // Check window.jupiter as fallback
    if (jupiterProvider) {
      return {
        name: "Jupiter",
        icon: "https://jup.ag/favicon.ico",
        provider: jupiterProvider,
        connect: async () => {
          const response = await jupiterProvider.connect();
          return { publicKey: new PublicKey(response.publicKey.toString()) };
        },
      };
    }

    return null;
  };

  const jupiterWallet = getJupiterWallet();
  const phantomWallet = windowWallets.find(w => w.name === "Phantom");

  const availableWallets: WindowWallet[] = [
    phantomWallet || {
      name: "Phantom",
      icon: "https://yt3.googleusercontent.com/0yNbMsS0-rUrtVJmKd6d0xTDmLDEn1qu_KkivaeIC3UmCuXntxE-CJZRhWoy93JXij1YSJFMhA=s900-c-k-c0x00ffffff-no-rj",
      provider: null,
      connect: async () => {
        throw new Error("Phantom wallet not detected. Please install the Phantom extension.");
      },
    },
    jupiterWallet || {
      name: "Jupiter",
      icon: "https://jup.ag/favicon.ico",
      provider: null,
      connect: async () => {
        throw new Error("Jupiter wallet not detected. Please install the Jupiter extension.");
      },
    },
    ...windowWallets.filter(w => w.name !== "Phantom" && w.name !== "Jupiter"),
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
            <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-sm border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
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
                      No wallets detected. Please install Phantom, Jupiter, Solflare, or Backpack wallet extension.
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
