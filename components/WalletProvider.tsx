"use client";

import { ReactNode } from "react";

/**
 * WalletProvider wrapper component
 * The @wallet-standard/react hooks work directly without needing a provider
 * This component is kept for compatibility and potential future enhancements
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
