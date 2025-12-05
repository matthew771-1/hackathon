import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { 
  withCastVote, 
  Vote, 
  YesNoVote,
  getGovernance,
  getProposal,
} from "@solana/spl-governance";
import { APP_CONFIG } from "./config";

/**
 * Build a complete transaction for casting a vote
 * 
 * @param realm - Realm address string
 * @param proposalId - Proposal address string
 * @param governingTokenMint - The governing token mint address
 * @param voterPublicKey - Voter's wallet public key
 * @param vote - YES or NO
 * @param network - mainnet or devnet
 * @returns Serialized transaction ready for wallet to sign
 */
export async function buildVoteTransaction(
  realm: string,
  proposalId: string,
  governingTokenMint: string,
  voterPublicKey: PublicKey,
  vote: "yes" | "no" | "abstain",
  network: "mainnet" | "devnet" = "mainnet"
): Promise<Transaction> {
  // Get connection
  const rpcUrl = network === "mainnet" 
    ? (process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || APP_CONFIG.solana.mainnet.rpc)
    : APP_CONFIG.solana.devnet.rpc;
  const connection = new Connection(rpcUrl, "confirmed");
  
  const realmPubkey = new PublicKey(realm);
  const proposalPubkey = new PublicKey(proposalId);
  const tokenMintPubkey = new PublicKey(governingTokenMint);
  const governanceProgramId = new PublicKey(APP_CONFIG.solanaDAOs.governanceProgramId);
  
  // Get the proposal to find its governance
  const proposal = await getProposal(connection, proposalPubkey);
  const governancePubkey = proposal.account.governance;
  
  // Get the governance to find the proposal owner record
  const governance = await getGovernance(connection, governancePubkey);
  
  // Derive the token owner record PDA for the voter
  const [tokenOwnerRecordPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("governance"),
      realmPubkey.toBuffer(),
      tokenMintPubkey.toBuffer(),
      voterPublicKey.toBuffer(),
    ],
    governanceProgramId
  );
  
  // Derive the proposal owner's token owner record
  // This is the record of whoever created the proposal
  const proposalOwnerRecord = proposal.account.tokenOwnerRecord;
  
  // Convert vote to SPL Governance Vote type
  let voteObj: Vote;
  if (vote === "yes") {
    voteObj = Vote.fromYesNoVote(YesNoVote.Yes);
  } else if (vote === "no") {
    voteObj = Vote.fromYesNoVote(YesNoVote.No);
  } else {
    // Abstain - use No vote with 0 weight (or just deny)
    voteObj = Vote.fromYesNoVote(YesNoVote.No);
  }
  
  // Build the transaction instructions
  const instructions: TransactionInstruction[] = [];
  
  // Add the cast vote instruction
  await withCastVote(
    instructions,
    governanceProgramId,
    3, // Program version (v3 for current Realms)
    realmPubkey,
    governancePubkey,
    proposalPubkey,
    proposalOwnerRecord,
    tokenOwnerRecordPDA,
    voterPublicKey, // governance authority (the voter)
    tokenMintPubkey,
    voteObj,
    voterPublicKey, // payer
    undefined, // voterWeightRecord (optional)
    undefined  // maxVoterWeightRecord (optional)
  );
  
  // Build transaction
  const transaction = new Transaction();
  instructions.forEach(ix => transaction.add(ix));
  
  // Get recent blockhash
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = voterPublicKey;
  
  return transaction;
}

/**
 * Simplified vote casting for use in UI components
 * Returns a serialized transaction that the wallet can sign
 */
export async function prepareVoteForWallet(
  realmAddress: string,
  proposalId: string,
  governingTokenMint: string,
  voterAddress: string,
  voteDecision: "yes" | "no" | "abstain",
  network: "mainnet" | "devnet" = "mainnet"
): Promise<{ transaction: string; message: string }> {
  try {
    const voterPubkey = new PublicKey(voterAddress);
    
    const transaction = await buildVoteTransaction(
      realmAddress,
      proposalId,
      governingTokenMint,
      voterPubkey,
      voteDecision,
      network
    );
    
    // Serialize the transaction so it can be sent to wallet for signing
    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    
    const base64Transaction = serialized.toString("base64");
    
    return {
      transaction: base64Transaction,
      message: `Vote ${voteDecision.toUpperCase()} on proposal ${proposalId.slice(0, 8)}...`,
    };
  } catch (error: any) {
    console.error("Error preparing vote transaction:", error);
    throw new Error(`Failed to prepare vote: ${error.message || error}`);
  }
}

/**
 * Check if a user has already voted on a proposal
 */
export async function hasUserVoted(
  connection: Connection,
  proposal: PublicKey,
  tokenOwnerRecord: PublicKey
): Promise<boolean> {
  try {
    const governanceProgramId = new PublicKey(APP_CONFIG.solanaDAOs.governanceProgramId);
    
    const [voteRecordPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("governance"),
        proposal.toBuffer(),
        tokenOwnerRecord.toBuffer(),
      ],
      governanceProgramId
    );
    
    let accountInfo;
    try {
      accountInfo = await connection.getAccountInfo(voteRecordPDA);
    } catch (error: any) {
      // Handle 403 RPC rate limit errors
      if (error?.message?.includes("403") || error?.code === 403 || error?.error?.code === 403) {
        console.error("⚠️ RPC rate limit (403) when checking vote status. Please set NEXT_PUBLIC_SOLANA_MAINNET_RPC in .env.local");
        return false;
      }
      // Re-throw other errors to be caught by outer catch
      throw error;
    }
    return accountInfo !== null;
  } catch (error: any) {
    // Handle other errors (not 403)
    if (!error?.message?.includes("403") && error?.code !== 403 && error?.error?.code !== 403) {
      console.error("Error checking vote status:", error);
    }
    return false;
  }
}
