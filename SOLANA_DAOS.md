# Popular Solana DAOs

This application supports integration with popular Solana DAOs that use SPL Governance for decentralized decision-making.

## Supported DAOs

The application now includes these 5 popular Solana DAOs:

### 1. **Mango DAO**
- **Token**: MNGO
- **Description**: Governs Mango Markets - a decentralized trading platform for margin trading, lending, and perpetual futures
- **Website**: https://mango.markets
- **Network**: Mainnet

### 2. **Jupiter DAO**
- **Token**: JUP
- **Description**: Governs Jupiter - Solana's leading DEX aggregator and swap platform
- **Website**: https://jup.ag
- **Network**: Mainnet

## Governance Program

All these DAOs use the **SPL Governance Program** (`GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw`) for their governance operations.

## Integration Status

- ✅ DAO listing and display
- ✅ Proposal viewing structure
- ⏳ Real blockchain data fetching (in progress)
- ⏳ On-chain voting implementation (in progress)

## Adding More DAOs

To add more Solana DAOs, update `lib/config.ts`:

```typescript
{
  name: "Your DAO Name",
  address: "GovernanceProgramAddress",
  description: "DAO description",
  network: "mainnet" as const,
  website: "https://yourdao.com",
  token: "TOKEN",
}
```

## Resources

- [SPL Governance Documentation](https://spl.solana.com/governance)
- [Solana DAOs on DeepDAO](https://deepdao.io/)
- [Realms DAO Platform](https://v2.realms.today/)

