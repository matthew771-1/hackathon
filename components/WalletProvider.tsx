"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useWallets } from "@wallet-standard/react";
import { StandardConnect } from "@wallet-standard/core";

interface WindowWallet {
  name: string;
  icon?: string;
  provider: any;
  connect: () => Promise<{ publicKey: PublicKey }>;
  signAndSendTransaction?: (transaction: Transaction) => Promise<{ signature: string }>;
}

interface WalletContextType {
  wallet: WindowWallet | null;
  publicKey: PublicKey | null;
  isConnected: boolean;
  connect: (walletName: string) => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (transaction: Transaction) => Promise<string>;
  availableWallets: WindowWallet[];
}

const WalletContext = createContext<WalletContextType | null>(null);

/**
 * WalletProvider wrapper component
 * Provides shared wallet state and transaction signing across all components
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const standardWallets = useWallets();
  const [windowWallets, setWindowWallets] = useState<WindowWallet[]>([]);
  const [connectedWallet, setConnectedWallet] = useState<WindowWallet | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);

  // Detect window-injected wallets
  useEffect(() => {
    if (typeof window === "undefined") return;

    const detectedWallets: WindowWallet[] = [];

    if (window.solana && (window.solana as any).isPhantom) {
      detectedWallets.push({
        name: "Phantom",
        icon: "https://yt3.googleusercontent.com/0yNbMsS0-rUrtVJmKd6d0xTDmLDEn1qu_KkivaeIC3UmCuXntxE-CJZRhWoy93JXij1YSJFMhA=s900-c-k-c0x00ffffff-no-rj",
        provider: window.solana,
        connect: async () => {
          const response = await window.solana!.connect!();
          return { publicKey: new PublicKey(response.publicKey.toString()) };
        },
        signAndSendTransaction: async (tx: Transaction) => {
          const signed = await window.solana!.signAndSendTransaction!(tx);
          return { signature: signed.signature };
        },
      });
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
        signAndSendTransaction: async (tx: Transaction) => {
          const signed = await window.solflare!.signAndSendTransaction!(tx);
          return { signature: signed.signature };
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
        signAndSendTransaction: async (tx: Transaction) => {
          const signed = await window.backpack!.signAndSendTransaction!(tx);
          return { signature: signed.signature };
        },
      });
    }

    setWindowWallets(detectedWallets);
  }, []);

  // Build available wallets list including Jupiter from standard wallets
  const getJupiterWallet = useCallback((): WindowWallet | null => {
    const jupiterStandardWallet = standardWallets.find(
      w => w.name.toLowerCase().includes("jupiter") || w.name.toLowerCase().includes("jup")
    );
    
    if (jupiterStandardWallet) {
      return {
        name: "Jupiter",
        icon: (jupiterStandardWallet as any).icon || "https://jup.ag/favicon.ico",
        provider: jupiterStandardWallet,
        connect: async () => {
          const walletAny = jupiterStandardWallet as any;
          const connectFeature = walletAny.features?.[StandardConnect] || walletAny.features?.["standard:connect"];
          
          if (connectFeature && typeof connectFeature.connect === 'function') {
            const result = await connectFeature.connect();
            if (result?.accounts?.length > 0) {
              return { publicKey: new PublicKey(result.accounts[0].address) };
            }
          }
          
          if (jupiterStandardWallet.accounts?.length > 0) {
            return { publicKey: new PublicKey(jupiterStandardWallet.accounts[0].address) };
          }
          
          throw new Error("Could not connect to Jupiter wallet");
        },
        signAndSendTransaction: async (tx: Transaction) => {
          const walletAny = jupiterStandardWallet as any;
          const signFeature = walletAny.features?.["solana:signAndSendTransaction"];
          
          if (signFeature && typeof signFeature.signAndSendTransaction === 'function') {
            const result = await signFeature.signAndSendTransaction({
              transaction: tx.serialize({ requireAllSignatures: false }),
              account: jupiterStandardWallet.accounts[0],
            });
            return { signature: result.signature };
          }
          
          throw new Error("Jupiter wallet does not support signing transactions");
        },
      };
    }
    return null;
  }, [standardWallets]);

  const availableWallets = [
    ...windowWallets,
    getJupiterWallet(),
  ].filter((w): w is WindowWallet => w !== null);

  const connect = useCallback(async (walletName: string) => {
    const wallet = availableWallets.find(w => w.name === walletName);
    if (!wallet) {
      throw new Error(`Wallet ${walletName} not found`);
    }
    
    const result = await wallet.connect();
    setConnectedWallet(wallet);
    setPublicKey(result.publicKey);
  }, [availableWallets]);

  const disconnect = useCallback(async () => {
    if (connectedWallet?.provider?.disconnect) {
      await connectedWallet.provider.disconnect();
    }
    setConnectedWallet(null);
    setPublicKey(null);
  }, [connectedWallet]);

  const signAndSendTransaction = useCallback(async (transaction: Transaction): Promise<string> => {
    if (!connectedWallet) {
      throw new Error("No wallet connected");
    }
    
    if (!connectedWallet.signAndSendTransaction) {
      // Fallback to provider methods
      if (connectedWallet.provider?.signAndSendTransaction) {
        const result = await connectedWallet.provider.signAndSendTransaction(transaction);
        return result.signature;
      }
      throw new Error("Wallet does not support signing transactions");
    }
    
    const result = await connectedWallet.signAndSendTransaction(transaction);
    return result.signature;
  }, [connectedWallet]);

  return (
    <WalletContext.Provider
      value={{
        wallet: connectedWallet,
        publicKey,
        isConnected: connectedWallet !== null && publicKey !== null,
        connect,
        disconnect,
        signAndSendTransaction,
        availableWallets,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within WalletProvider");
  }
  return context;
}
