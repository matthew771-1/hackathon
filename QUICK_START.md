# Quick Start Guide

## 🚀 Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Development Server

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## 🧪 Testing the Application

### Step 1: Connect Your Wallet

1. Click the "Connect Wallet" button
2. Select your wallet (Phantom, Solflare, or Backpack)
3. Approve the connection in your wallet extension

### Step 2: Create an AI Agent

1. Go to the "My Agents" tab
2. Fill out the agent creation form:
   - **Agent Name**: e.g., "Conservative Voter"
   - **Personality**: Describe how the agent should make decisions
   - **Risk Tolerance**: Choose Conservative, Moderate, or Aggressive
   - **Auto Vote**: Enable/disable automatic voting
3. Click "Create Agent"

### Step 3: Initialize the Agent

1. Find your newly created agent in the list
2. Click "Initialize AI Agent (Requires OpenAI API Key)"
3. Enter your OpenAI API key (get one from [OpenAI Platform](https://platform.openai.com/api-keys))
4. Click "Initialize Agent"

**Note**: The OpenAI API key is stored locally in your browser and never sent to our servers.

### Step 4: Browse DAOs

1. Switch to the "Browse DAOs" tab
2. You'll see a list of popular Realms DAOs
3. Click "View DAO" on any DAO to see details

### Step 5: Analyze Proposals

1. In the DAO detail view, select your AI agent from the dropdown
2. Scroll down to see proposals
3. Click "Analyze with [Agent Name]" on any proposal
4. Wait for the AI analysis (may take a few seconds)
5. Review the recommendation, reasoning, and confidence score

### Step 6: Configure Settings (Optional)

1. Click the "⚙️ Settings" button in the header
2. Choose your network (Devnet/Mainnet)
3. Optionally set a custom RPC endpoint
4. Click "Save Settings"

## 📋 Current Features

✅ **Working Features:**
- Wallet connection (Phantom, Solflare, Backpack)
- AI agent creation with custom personalities
- Agent initialization with OpenAI API
- DAO browsing with stats
- Proposal viewing
- AI-powered proposal analysis
- Settings configuration

⏳ **Coming Soon:**
- Real blockchain data integration
- On-chain voting
- Real-time proposal updates
- Circle/USDC integration

## 🔧 Environment Setup

### Optional: Custom RPC Endpoint

Create a `.env.local` file:

```env
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
```

Or use the Settings UI to configure it.

### Required: OpenAI API Key

You'll need an OpenAI API key to use the AI analysis features:
1. Sign up at [OpenAI Platform](https://platform.openai.com/)
2. Get your API key from [API Keys page](https://platform.openai.com/api-keys)
3. Enter it when initializing an agent

## 🐛 Troubleshooting

### Wallet Not Connecting
- Make sure you have a Solana wallet extension installed
- Try refreshing the page
- Check that your wallet is unlocked

### Agent Initialization Fails
- Verify your OpenAI API key is correct
- Check your OpenAI account has credits
- Ensure the API key has proper permissions

### No DAOs Showing
- Check your network settings (Devnet vs Mainnet)
- Try refreshing the page
- Check browser console for errors

### Proposals Not Loading
- This is expected - currently using mock data
- Real proposal fetching will be implemented next

## 📝 Next Steps

1. **Test the Complete Flow**
   - Create agent → Initialize → Browse DAO → Analyze proposal

2. **Try Different Agent Personalities**
   - Create multiple agents with different risk tolerances
   - Compare their analysis of the same proposal

3. **Explore Settings**
   - Switch between Devnet and Mainnet
   - Try custom RPC endpoints

4. **Ready for Real Integration?**
   - We can now implement actual blockchain data fetching
   - Connect to real Realms DAOs
   - Implement on-chain voting

## 🎯 Hackathon Checklist

- [x] Basic UI structure
- [x] Wallet connection
- [x] AI agent creation
- [x] Proposal analysis UI
- [ ] Real blockchain data
- [ ] On-chain voting
- [ ] Circle/USDC integration
- [ ] Demo video
- [ ] Documentation

## 💡 Tips

- **For Demo**: Use mock data to show the full flow
- **For Real Data**: We'll need to implement Realms API integration
- **For Voting**: SPL Governance transactions need to be implemented
- **For Circle Bounty**: USDC payment features can be added

## 🆘 Need Help?

Check the following files:
- `PROJECT_OVERVIEW.md` - Full project documentation
- `PROGRESS.md` - Development progress
- `README.md` - General information

Happy building! 🚀

