import { Keypair } from "@solana/web3.js";
import type { Proposal, AIAgent, ProposalAnalysis } from "@/types/dao";

/**
 * Simple agent configuration holder
 * Replaces SolanaAgentKit for our use case (we only need to store config)
 */
export interface GovernanceAgentConfig {
  openAIApiKey: string;
  rpcUrl: string;
  walletPublicKey: string;
}

/**
 * Create a governance agent configuration
 */
export function createGovernanceAgent(
  keypair: Keypair,
  rpcUrl: string,
  openAIApiKey: string
): GovernanceAgentConfig {
  return {
    openAIApiKey,
    rpcUrl,
    walletPublicKey: keypair.publicKey.toString(),
  };
}

/**
 * Validate an OpenAI API key by making a test request
 */
export async function validateOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error("Error validating OpenAI key:", error);
    return false;
  }
}

/**
 * Create a system prompt for the AI agent based on personality
 */
function createGovernanceSystemPrompt(agent: AIAgent): string {
  const focusAreas = agent.votingPreferences.focusAreas.length > 0 
    ? agent.votingPreferences.focusAreas.join(", ")
    : "General governance";
    
  const decisionSpeed = agent.votingPreferences.decisionSpeed === "fast"
    ? "You prefer to make quick decisions based on initial analysis."
    : "You prefer to deliberate carefully before making decisions.";
    
  const treasuryPriority = agent.votingPreferences.treasuryPriority === "growth"
    ? "You prioritize growth and are willing to invest treasury funds for expansion."
    : "You prioritize treasury preservation and are cautious about spending.";

  return `You are an AI governance agent named "${agent.name}" helping to analyze DAO proposals.

PERSONALITY & VALUES:
${agent.personality}

VOTING PREFERENCES:
- Risk Tolerance: ${agent.votingPreferences.riskTolerance}
- Focus Areas: ${focusAreas}
- Decision Style: ${decisionSpeed}
- Treasury Approach: ${treasuryPriority}

YOUR ROLE:
Analyze proposals objectively while staying true to the personality and preferences above.
Consider the proposal's impact on the DAO, its members, and long-term sustainability.
Be specific in your reasoning and cite concrete factors from the proposal.`;
}

/**
 * Analyze a proposal using OpenAI directly
 */
export async function analyzeProposal(
  agentConfig: GovernanceAgentConfig,
  proposal: Proposal,
  agentPersonality: AIAgent
): Promise<ProposalAnalysis> {
  const apiKey = agentConfig.openAIApiKey;
  
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  const systemPrompt = createGovernanceSystemPrompt(agentPersonality);
  
  const userPrompt = `Analyze this DAO proposal and provide your voting recommendation:

PROPOSAL DETAILS:
- Title: ${proposal.title}
- Description: ${proposal.description}
- Status: ${proposal.status}
- Current Votes: ${proposal.votesYes} YES / ${proposal.votesNo} NO
- Proposer: ${proposal.proposer}
${proposal.votingEndsAt ? `- Voting Ends: ${proposal.votingEndsAt.toISOString()}` : ""}

Based on your personality and preferences, analyze this proposal and decide: should you vote YES, NO, or ABSTAIN?

Respond with a JSON object (no markdown, just raw JSON):
{
  "recommendation": "yes" or "no" or "abstain",
  "reasoning": "Your detailed reasoning (2-3 sentences explaining your decision)",
  "confidence": number between 0 and 100,
  "keyFactors": ["factor 1", "factor 2", "factor 3"]
}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      
      if (response.status === 401) {
        throw new Error("Invalid OpenAI API key. Please check your API key and try again.");
      } else if (response.status === 429) {
        throw new Error("OpenAI rate limit exceeded. Please wait a moment and try again.");
      } else if (response.status === 402) {
        throw new Error("OpenAI API quota exceeded. Please check your billing.");
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    const cleanContent = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    try {
      const parsed = JSON.parse(cleanContent);
      
      const recommendation = ["yes", "no", "abstain"].includes(parsed.recommendation?.toLowerCase())
        ? parsed.recommendation.toLowerCase() as "yes" | "no" | "abstain"
        : "abstain";
        
      const confidence = typeof parsed.confidence === "number"
        ? Math.min(100, Math.max(0, parsed.confidence))
        : 50;
        
      const reasoning = typeof parsed.reasoning === "string"
        ? parsed.reasoning
        : "Unable to provide detailed reasoning.";
        
      const keyFactors = Array.isArray(parsed.keyFactors)
        ? parsed.keyFactors.filter((f: any) => typeof f === "string").slice(0, 5)
        : [];

      return {
        recommendation,
        reasoning,
        confidence,
        keyFactors,
      };
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError, content);
      
      const lowerContent = content.toLowerCase();
      let recommendation: "yes" | "no" | "abstain" = "abstain";
      
      if (lowerContent.includes('"yes"') || lowerContent.includes("vote yes")) {
        recommendation = "yes";
      } else if (lowerContent.includes('"no"') || lowerContent.includes("vote no")) {
        recommendation = "no";
      }
      
      return {
        recommendation,
        reasoning: content.slice(0, 300),
        confidence: 50,
        keyFactors: [],
      };
    }
  } catch (error: any) {
    console.error("Error analyzing proposal:", error);
    throw error;
  }
}

/**
 * Check if agent should auto-vote based on preferences
 */
export function shouldAutoVote(
  agent: AIAgent,
  analysis: { recommendation: string; confidence: number }
): boolean {
  if (!agent.votingPreferences.autoVote) {
    return false;
  }

  const minConfidence = agent.votingPreferences.minVotingThreshold || 70;
  return analysis.confidence >= minConfidence;
}
