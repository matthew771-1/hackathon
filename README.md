# DAO AI Agent

AI-powered governance delegation for Solana DAOs. Delegate your governance power to AI agents that can analyze proposals and vote on your behalf.

## Features

- 🔌 Connect Solana wallets using Wallet Standard
- 🤖 Create and customize AI agent personalities
- 📊 Browse and monitor Realms DAOs
- 🗳️ Delegate governance power to AI agents
- ⚡ Automated proposal analysis and voting
- 📈 DAO analytics dashboard (coming soon)

## Getting Started

### Prerequisites

- Node.js 20+ 
- pnpm (or npm/yarn)
- A Solana wallet (Phantom, Solflare, or Backpack)

### Installation

```bash
pnpm install
```

### Environment Setup

Create a `.env.local` file (optional):

```env
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Next.js 15** - React framework
- **@solana/kit** - Solana JavaScript API
- **@solana/react** - React hooks for Solana
- **@solana/spl-governance** - SPL Governance program integration
- **@solana/spl-token** - SPL Token program
- **@wallet-standard/react** - Wallet Standard integration
- **solana-agent-kit** - SendAI Solana Agent Kit for AI-powered governance (https://github.com/sendaifun/solana-agent-kit)
- **Popular Solana DAOs** - Mango DAO, BonkDAO, Star Atlas DAO, SuperteamDAO, UXD Protocol, Jupiter DAO
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main dashboard
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── WalletButton.tsx  # Wallet connection
│   ├── DAOList.tsx       # DAO listing
│   ├── DAODetail.tsx     # DAO detail view with proposals
│   ├── AgentCreator.tsx  # AI agent creation
│   ├── AgentList.tsx     # Agent management
│   ├── AgentInitializer.tsx # Initialize agents with OpenAI
│   ├── ProposalCard.tsx  # Proposal display and analysis
│   └── ProposalList.tsx  # List of proposals
├── lib/                   # Utility functions
│   ├── config.ts         # Application configuration
│   ├── utils.ts          # Utility functions
│   ├── realms.ts         # Realms DAO integration
│   ├── governance.ts     # Governance operations
│   └── ai-agent.ts       # AI agent logic
├── hooks/                 # React hooks
│   └── useAgentService.ts # Agent service management
├── types/                 # TypeScript types
│   └── dao.ts            # DAO and agent types
└── PROJECT_OVERVIEW.md   # Detailed project documentation
```

## Hackathon Project

This project is being built for the University Blockchain Conference hackathon:
- **Track**: Solana Track
- **Bounties**: Circle/USDC Bounty
- **Focus**: Realms DAO governance automation

See [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) for detailed project information.

## Development Status

- ✅ Wallet connection setup
- ✅ Basic UI structure
- ✅ AI agent creation interface
- ✅ DAO listing component
- ✅ SendAI Solana Agent Kit integration
- ✅ Proposal analysis UI components
- ✅ DAO detail view with proposals
- ✅ Agent initialization with OpenAI API
- ✅ Agent service hook for managing AI agents
- ✅ Proposal analysis flow
- ✅ Settings page for network configuration
- ✅ Enhanced Realms integration with better data structure
- ✅ Utility functions for formatting and validation
- ⏳ Realms integration (in progress)
- ⏳ Proposal fetching from Realms
- ⏳ Automated voting implementation
- ⏳ Circle/USDC integration

## License

MIT


