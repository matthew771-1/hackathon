"use client";

import { useState, useEffect } from "react";
import type { Proposal, ProposalAnalysis } from "@/types/dao";
import type { AIAgent } from "@/types/dao";
import { formatAddress, getTimeRemaining, getStatusColor } from "@/lib/utils";
import { 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ThumbsUp, 
  ThumbsDown, 
  MinusCircle,
  Bot,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Wallet
} from "lucide-react";
import { Transaction, VersionedTransaction } from "@solana/web3.js";

// Window wallet types
interface WindowWallet {
  publicKey: { toString: () => string } | null;
  isConnected: boolean;
  signAndSendTransaction: (transaction: Transaction | VersionedTransaction) => Promise<{ signature: string }>;
  signTransaction?: (transaction: Transaction) => Promise<Transaction>;
}

export function ProposalCard({
  proposal,
  agent,
  onAnalyze,
  analysis: externalAnalysis,
  isAnalyzing: externalIsAnalyzing,
  daoAddress,
  daoNetwork,
  governingTokenMint,
}: {
  proposal: Proposal;
  agent?: AIAgent;
  onAnalyze?: (proposal: Proposal, agent: AIAgent) => Promise<void>;
  analysis?: ProposalAnalysis | null;
  isAnalyzing?: boolean;
  daoAddress?: string;
  daoNetwork?: "mainnet" | "devnet";
  governingTokenMint?: string;
}) {
  const [windowWallet, setWindowWallet] = useState<WindowWallet | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  const [internalAnalysis, setInternalAnalysis] = useState<ProposalAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [showFullReasoning, setShowFullReasoning] = useState(false);
  const [showOverrideOptions, setShowOverrideOptions] = useState(false);

  // Detect connected wallet from window object
  useEffect(() => {
    const checkWallet = () => {
      if (typeof window === "undefined") return;
      
      // Check Phantom
      const phantom = (window as any).solana;
      if (phantom?.isPhantom && phantom?.isConnected && phantom?.publicKey) {
        setWindowWallet(phantom);
        setWalletAddress(phantom.publicKey.toString());
        return;
      }
      
      // Check Solflare
      const solflare = (window as any).solflare;
      if (solflare?.isSolflare && solflare?.isConnected && solflare?.publicKey) {
        setWindowWallet(solflare);
        setWalletAddress(solflare.publicKey.toString());
        return;
      }
      
      // Check Backpack
      const backpack = (window as any).backpack;
      if (backpack?.isBackpack && backpack?.isConnected && backpack?.publicKey) {
        setWindowWallet(backpack);
        setWalletAddress(backpack.publicKey.toString());
        return;
      }
      
      setWindowWallet(null);
      setWalletAddress(null);
    };
    
    checkWallet();
    
    // Re-check periodically in case wallet connects/disconnects
    const interval = setInterval(checkWallet, 1000);
    return () => clearInterval(interval);
  }, []);

  // Use external analysis if provided, otherwise use internal state
  const analysis = externalAnalysis || internalAnalysis;
  const analyzing = externalIsAnalyzing !== undefined ? externalIsAnalyzing : isAnalyzing;

  const handleAnalyze = async () => {
    if (!agent || !onAnalyze) return;

    if (externalIsAnalyzing === undefined) {
      setIsAnalyzing(true);
    }

    try {
      await onAnalyze(proposal, agent);
    } catch (error) {
      console.error("Error analyzing proposal:", error);
    } finally {
      if (externalIsAnalyzing === undefined) {
        setIsAnalyzing(false);
      }
    }
  };

  const handleVote = async (vote: "yes" | "no" | "abstain") => {
    if (!windowWallet || !walletAddress || !daoAddress) {
      alert("Please connect your wallet to vote. Make sure Phantom, Solflare, or Backpack is connected.");
      return;
    }

    if (!governingTokenMint) {
      alert("Governing token mint not configured for this DAO");
      return;
    }

    setIsVoting(true);
    setVoteError(null);
    setVoteSuccess(null);
    setShowOverrideOptions(false);

    try {
      // Call API to prepare vote transaction
      const response = await fetch("/api/vote/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          realmAddress: daoAddress,
          proposalId: proposal.id,
          governingTokenMint,
          voterAddress: walletAddress,
          vote,
          network: daoNetwork || "mainnet",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to prepare vote transaction");
      }

      // Decode the base64 transaction
      const transactionBuffer = Buffer.from(data.transaction, "base64");
      
      // Deserialize the transaction
      const transaction = Transaction.from(transactionBuffer);

      // Sign and send using the window wallet
      const result = await windowWallet.signAndSendTransaction(transaction);
      
      const signature = result.signature;

      setVoteSuccess(`Vote submitted! Tx: ${signature.slice(0, 8)}...`);
      
      setTimeout(() => setVoteSuccess(null), 5000);
    } catch (error: any) {
      console.error("Error voting:", error);
      setVoteError(error.message || "Failed to submit vote");
      
      setTimeout(() => setVoteError(null), 5000);
    } finally {
      setIsVoting(false);
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case "yes":
        return <ThumbsUp className="w-5 h-5" />;
      case "no":
        return <ThumbsDown className="w-5 h-5" />;
      default:
        return <MinusCircle className="w-5 h-5" />;
    }
  };

  const getRecommendationStyle = (recommendation: string) => {
    switch (recommendation) {
      case "yes":
        return "bg-green-500/20 border-green-500/50 text-green-400";
      case "no":
        return "bg-red-500/20 border-red-500/50 text-red-400";
      default:
        return "bg-slate-500/20 border-slate-500/50 text-slate-400";
    }
  };

  const isVotingActive = proposal.status === "voting";
  const isWalletConnected = !!windowWallet && !!walletAddress;

  return (
    <div className="p-5 border border-slate-700 rounded-xl bg-slate-800/50 hover:border-slate-600 transition-all">
      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-3">
        <h3 className="text-lg font-semibold text-white flex-1 leading-tight">{proposal.title}</h3>
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(proposal.status)}`}>
          {proposal.status.toUpperCase()}
        </span>
      </div>

      {/* Description */}
      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{proposal.description}</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-slate-900/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Yes Votes</span>
            <ThumbsUp className="w-3.5 h-3.5 text-green-400" />
          </div>
          <span className="text-lg font-bold text-green-400">{proposal.votesYes.toLocaleString()}</span>
        </div>
        <div className="p-3 bg-slate-900/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">No Votes</span>
            <ThumbsDown className="w-3.5 h-3.5 text-red-400" />
          </div>
          <span className="text-lg font-bold text-red-400">{proposal.votesNo.toLocaleString()}</span>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400 mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>
            {proposal.votingEndsAt
              ? getTimeRemaining(proposal.votingEndsAt)
              : new Date(proposal.createdAt).toLocaleDateString()}
          </span>
        </div>
        <a
          href={`https://solscan.io/account/${proposal.proposer}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono hover:text-purple-400 transition-colors"
        >
          Proposer: {formatAddress(proposal.proposer)}
        </a>
        {daoAddress && (
          <a
            href={`https://v2.realms.today/dao/${daoAddress}/proposal/${proposal.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View on Realms
          </a>
        )}
      </div>

      {/* AI Analysis Section */}
      {analysis && (
        <div className={`mb-4 p-4 rounded-lg border ${getRecommendationStyle(analysis.recommendation)}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {getRecommendationIcon(analysis.recommendation)}
              <span className="font-bold text-lg">
                {analysis.recommendation.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-75">Confidence</span>
              <span className="font-bold">{analysis.confidence}%</span>
            </div>
          </div>
          
          <p className={`text-sm ${showFullReasoning ? '' : 'line-clamp-2'}`}>
            {analysis.reasoning}
          </p>
          
          {analysis.reasoning.length > 100 && (
            <button
              onClick={() => setShowFullReasoning(!showFullReasoning)}
              className="text-xs mt-2 flex items-center gap-1 opacity-75 hover:opacity-100 transition-opacity"
            >
              {showFullReasoning ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show full reasoning
                </>
              )}
            </button>
          )}

          {analysis.keyFactors && analysis.keyFactors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-current/20">
              <span className="text-xs font-medium opacity-75">Key Factors:</span>
              <ul className="mt-1 space-y-1">
                {analysis.keyFactors.map((factor, idx) => (
                  <li key={idx} className="text-xs opacity-75">• {factor}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Vote Success/Error Messages */}
      {voteSuccess && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-sm text-green-400">{voteSuccess}</p>
        </div>
      )}

      {voteError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-400" />
          <p className="text-sm text-red-400">{voteError}</p>
        </div>
      )}

      {/* Wallet Status */}
      {!isWalletConnected && isVotingActive && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
          <Wallet className="w-5 h-5 text-amber-400" />
          <p className="text-sm text-amber-400">Connect your wallet to vote on this proposal</p>
        </div>
      )}

      {/* Action Buttons */}
      {agent && (
        <div className="space-y-3">
          {/* Analyze Button (show when no analysis) */}
          {!analysis && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing || isVoting}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-fuchsia-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  Analyze with {agent.name}
                </>
              )}
            </button>
          )}
          
          {/* Vote Buttons (show when analysis exists) */}
          {analysis && (
            <div className="space-y-2">
              {/* Follow AI Button */}
              {analysis.recommendation !== "abstain" && isVotingActive && (
                <button
                  onClick={() => handleVote(analysis.recommendation as "yes" | "no")}
                  disabled={isVoting || !isWalletConnected}
                  className={`w-full px-4 py-3 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    analysis.recommendation === "yes"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isVoting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Vote...
                    </>
                  ) : (
                    <>
                      {analysis.recommendation === "yes" ? (
                        <ThumbsUp className="w-4 h-4" />
                      ) : (
                        <ThumbsDown className="w-4 h-4" />
                      )}
                      Follow AI & Vote {analysis.recommendation.toUpperCase()}
                    </>
                  )}
                </button>
              )}

              {/* Override Button */}
              {isVotingActive && (
                <div>
                  <button
                    onClick={() => setShowOverrideOptions(!showOverrideOptions)}
                    disabled={isVoting || !isWalletConnected}
                    className="w-full px-4 py-2.5 bg-slate-700 text-slate-300 font-medium rounded-lg hover:bg-slate-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Override AI Decision
                    {showOverrideOptions ? (
                      <ChevronUp className="w-4 h-4 ml-auto" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                  
                  {showOverrideOptions && (
                    <div className="mt-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
                      <p className="text-xs text-slate-400 mb-3">Choose your vote:</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleVote("yes")}
                          disabled={isVoting || !isWalletConnected}
                          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          Yes
                        </button>
                        <button
                          onClick={() => handleVote("no")}
                          disabled={isVoting || !isWalletConnected}
                          className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          No
                        </button>
                        <button
                          onClick={() => handleVote("abstain")}
                          disabled={isVoting || !isWalletConnected}
                          className="flex-1 px-3 py-2 bg-slate-600 text-white text-sm font-medium rounded-lg hover:bg-slate-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                          Abstain
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Re-analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={analyzing || isVoting}
                className="w-full px-4 py-2 text-slate-400 text-sm hover:text-slate-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Re-analyzing...
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5" />
                    Re-analyze
                  </>
                )}
              </button>

              {/* Not voting warning */}
              {!isVotingActive && (
                <p className="text-xs text-center text-slate-500">
                  Voting is not active for this proposal
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
