interface Window {
  solana?: {
    isPhantom?: boolean;
    connect?: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect?: () => Promise<void>;
  };
  solflare?: {
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect?: () => Promise<void>;
  };
  backpack?: {
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect?: () => Promise<void>;
  };
}

