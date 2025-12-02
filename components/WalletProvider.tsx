"use client";

import { ReactNode } from "react";

export function WalletProvider({ children }: { children: ReactNode }) {
  // Note: WalletStandardProvider doesn't exist in @wallet-standard/react 1.0.1
  // The hooks (useWallets, useConnect, etc.) work directly without a provider
  // as they access wallets from browser extensions via the Wallet Standard API
  return <>{children}</>;
}


