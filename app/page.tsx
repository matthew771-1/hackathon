"use client";

import { WalletProvider } from "@/components/WalletProvider";
import { WalletButton } from "@/components/WalletButton";

export default function Home() {
  return (
    <WalletProvider>
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">DAO AI Agent</h1>
          <p className="text-lg mb-8 text-gray-600 dark:text-gray-400">
            Delegate your governance power to AI agents for efficient DAO participation
          </p>
          <WalletButton />
        </div>
      </main>
    </WalletProvider>
  );
}


