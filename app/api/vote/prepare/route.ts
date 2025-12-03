import { NextRequest, NextResponse } from "next/server";
import { prepareVoteForWallet } from "@/lib/governance-voting";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { realmAddress, proposalId, governingTokenMint, voterAddress, vote, network } = body;
    
    // Validate inputs
    if (!realmAddress || !proposalId || !governingTokenMint || !voterAddress || !vote) {
      return NextResponse.json(
        { error: "Missing required parameters: realmAddress, proposalId, governingTokenMint, voterAddress, vote" },
        { status: 400 }
      );
    }
    
    if (vote !== "yes" && vote !== "no") {
      return NextResponse.json(
        { error: "Invalid vote value. Must be 'yes' or 'no'" },
        { status: 400 }
      );
    }
    
    // Prepare the vote transaction
    const result = await prepareVoteForWallet(
      realmAddress,
      proposalId,
      governingTokenMint,
      voterAddress,
      vote as "yes" | "no",
      network || "mainnet"
    );
    
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error in /api/vote/prepare:", error);
    return NextResponse.json(
      { error: error.message || "Failed to prepare vote transaction" },
      { status: 500 }
    );
  }
}

