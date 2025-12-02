"use client";

import { useState, useEffect } from "react";
import type { UiWallet } from "@wallet-standard/react";
import { useConnect, useDisconnect, useWallets } from "@wallet-standard/react";
import { StandardConnect } from "@wallet-standard/core";
import { PublicKey } from "@solana/web3.js";

interface WindowWallet {
  name: string;
  icon?: string;
  provider: any;
  connect: () => Promise<{ publicKey: PublicKey }>;
}

export function WalletButton() {
  const allWallets = useWallets();
  const [windowWallets, setWindowWallets] = useState<WindowWallet[]>([]);
  const [connectedWindowWallet, setConnectedWindowWallet] = useState<WindowWallet | null>(null);
  const [windowPublicKey, setWindowPublicKey] = useState<PublicKey | null>(null);

  // Filter Wallet Standard wallets to only those that support standard:connect
  const standardWallets = allWallets.filter(
    (wallet) =>
      wallet.chains?.some((c) => c.startsWith("solana:")) &&
      wallet.features.includes(StandardConnect)
  );

  // Detect window-injected wallets (Phantom, Solflare, Backpack)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const detectedWallets: WindowWallet[] = [];

    // Detect Phantom
    if (window.solana && (window.solana as any).isPhantom) {
      detectedWallets.push({
        name: "Phantom",
        icon: "https://phantom.app/img/logo.png",
        provider: window.solana,
        connect: async () => {
          const response = await window.solana!.connect!();
          return { publicKey: new PublicKey(response.publicKey.toString()) };
        },
      });
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

  const allWalletsAvailable = standardWallets.length > 0 || windowWallets.length > 0;

  if (!allWalletsAvailable) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
        <p>No wallets detected. Please install a Solana wallet extension like Phantom or Backpack.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Connect Wallet</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Window wallets (Phantom, Solflare, Backpack) */}
        {windowWallets.map((wallet, index) => (
          <WindowWalletItem
            key={`window-${wallet.name}-${index}`}
            wallet={wallet}
            isConnected={connectedWindowWallet?.name === wallet.name && windowPublicKey !== null}
            publicKey={connectedWindowWallet?.name === wallet.name ? windowPublicKey : null}
            onConnect={async () => {
              try {
                const { publicKey } = await wallet.connect();
                setConnectedWindowWallet(wallet);
                setWindowPublicKey(publicKey);
              } catch (error) {
                console.error("Failed to connect:", error);
                alert("Failed to connect wallet. Please try again.");
              }
            }}
            onDisconnect={async () => {
              try {
                if (wallet.provider?.disconnect) {
                  await wallet.provider.disconnect();
                }
                setConnectedWindowWallet(null);
                setWindowPublicKey(null);
              } catch (error) {
                console.error("Failed to disconnect:", error);
              }
            }}
          />
        ))}
        {/* Standard wallets */}
        {standardWallets.map((wallet, index) => (
          <StandardWalletItem
            key={`standard-${wallet.name}-${index}`}
            wallet={wallet}
          />
        ))}
      </div>
    </div>
  );
}

function StandardWalletItem({ wallet }: { wallet: UiWallet }) {
  // Only use useConnect if wallet supports standard:connect
  const supportsConnect = wallet.features.includes(StandardConnect);
  const [isConnecting, connect] = supportsConnect ? useConnect(wallet) : [false, null];
  const [isDisconnecting, disconnect] = useDisconnect(wallet);
  const isConnected = wallet.accounts.length > 0;
  const isPending = isConnecting || isDisconnecting;

  const handleClick = async () => {
    if (isConnected) {
      try {
        if (disconnect) {
          await disconnect();
        }
      } catch (error) {
        console.error("Failed to disconnect:", error);
      }
    } else {
      try {
        if (connect) {
          await connect();
        } else {
          // Fallback: try to use the wallet's connect feature directly
          const walletAny = wallet as any;
          const connectFeature = walletAny.features?.["standard:connect"];
          if (connectFeature && typeof connectFeature.connect === "function") {
            await connectFeature.connect();
          } else {
            alert("This wallet does not support the standard connect feature.");
          }
        }
      } catch (error) {
        console.error("Failed to connect:", error);
        alert("Failed to connect wallet. Please try again.");
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending || !supportsConnect}
      className={`p-4 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isConnected
          ? "bg-green-50 dark:bg-green-900/20 border-green-500"
          : "hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      <div className="font-semibold">{wallet.name}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {isConnected
          ? `${wallet.accounts.length} account${wallet.accounts.length !== 1 ? "s" : ""} connected`
          : supportsConnect
          ? "Click to connect"
          : "Not supported"}
      </div>
      {isPending && <div className="text-xs mt-2 text-blue-600 dark:text-blue-400">Processing...</div>}
    </button>
  );
}

function WindowWalletItem({
  wallet,
  isConnected,
  publicKey,
  onConnect,
  onDisconnect,
}: {
  wallet: WindowWallet;
  isConnected: boolean;
  publicKey: PublicKey | null;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}) {
  const [isPending, setIsPending] = useState(false);

  const handleClick = async () => {
    setIsPending(true);
    try {
      if (isConnected) {
        await onDisconnect();
      } else {
        await onConnect();
      }
    } finally {
      setIsPending(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`p-4 border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isConnected
          ? "bg-green-50 dark:bg-green-900/20 border-green-500"
          : "hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      <div className="font-semibold">{wallet.name}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {isConnected && publicKey
          ? `Connected (${formatAddress(publicKey.toString())})`
          : "Click to connect"}
      </div>
      {isPending && <div className="text-xs mt-2 text-blue-600 dark:text-blue-400">Processing...</div>}
    </button>
  );
}


