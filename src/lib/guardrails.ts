import { GoogleGenAI } from "@google/genai";
import { ComplianceAuditItem, RiskType } from "@/types";

interface GuardrailPattern {
  pattern: RegExp;
  riskType: RiskType;
  defaultReplacement: string;
  rationale: string;
}

const GUARDRAIL_PATTERNS: GuardrailPattern[] = [
  {
    pattern: /\b(?:guaranteed?\s+(?:\d+x|\d+%\s*)?roi|100%\s*roi|guarantee\s+returns?|guaranteed\s+profit)\b/gi,
    riskType: "guaranteed_results",
    defaultReplacement: "engineered for measurable, scalable impact",
    rationale: "Absolute ROI guarantees violate advertising compliance and regulatory investor protection standards. Replaced with defensible impact terminology.",
  },
  {
    pattern: /\b(?:100%\s*guaranteed?|guaranteed\s+success|guaranteed\s+results?|guarantee\s+outcomes?)\b/gi,
    riskType: "guaranteed_results",
    defaultReplacement: "designed for predictable, high-confidence outcomes",
    rationale: "Absolute performance promises violate platform advertising rules. Replaced with high-confidence methodologies.",
  },
  {
    pattern: /\b(?:100%\s*cure|instant\s*cure|cures?\s+(?:all|cancer|diseases?)|medical\s*miracle|miracle\s*healing)\b/gi,
    riskType: "medical_claim",
    defaultReplacement: "scientifically studied support protocol",
    rationale: "Unverified medical or cure claims strictly breach FDA/FTC regulations. Rewritten to compliant, non-diagnostic wellness language.",
  },
  {
    pattern: /\b(?:treats?\s+all\s+symptoms?|permanently\s+eliminates?\s+illness|reverses?\s+all\s+conditions?)\b/gi,
    riskType: "medical_claim",
    defaultReplacement: "formulated to support physiological resilience",
    rationale: "Definitive disease-reversal assertions trigger strict regulatory enforcement. Rewritten to general support phrasing.",
  },
  {
    pattern: /\b(?:zero\s*risk|100%\s*risk-free|risk-free\s*guarantee|no\s*risk\s*involved)\b/gi,
    riskType: "prohibited_phrase",
    defaultReplacement: "de-risked architecture backed by enterprise-grade governance",
    rationale: "'Zero risk' claims create direct legal exposure and breach consumer truth-in-advertising rules. Reframed around enterprise governance.",
  },
  {
    pattern: /\b(?:get\s+rich\s+quick|effortless\s+millions?|make\s+money\s+overnight|passive\s+millions?)\b/gi,
    riskType: "prohibited_phrase",
    defaultReplacement: "sustainable, compounding enterprise growth",
    rationale: "Deceptive wealth claims trigger FTC penalties and advertising bans. Replaced with compounding sustainable growth.",
  },
];

export interface GuardrailScanResult {
  sanitizedText: string;
  auditLog: ComplianceAuditItem[];
}

/**
 * Attempts an LLM rewrite for a risky sentence using Google Gemini.
 * Falls back to deterministic rule-based replacement if no API key is active.
 */
async function rewriteWithLLM(
  riskySnippet: string,
  riskType: RiskType,
  fallbackReplacement: string
): Promise<string> {
  const prompt = `You are a strict enterprise compliance officer. Rewrite the following risky marketing phrase into a safe, high-converting, enterprise-grade compliant phrase.
Do NOT use absolute guarantees, zero-risk promises, or unverified medical/financial claims.
Risky phrase: "${riskySnippet}"
Risk category: "${riskType}"
Return ONLY the single rewritten phrase, with no quotes or commentary.`;

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const res = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: {
          temperature: 0.2,
          maxOutputTokens: 60,
        },
      });

      const text = res.text?.trim();
      if (text) {
        return text.replace(/^["']|["']$/g, "");
      }
    } catch (err) {
      console.warn("[OrbitApp] Gemini LLM rewrite fallback triggered:", err);
    }
  }

  // Deterministic safe enterprise replacement
  return fallbackReplacement;
}

/**
 * Scans input copy for compliance violations (guaranteed results, medical claims, prohibited phrases).
 * Applies regex detection and Gemini proactive rewriting, returning sanitized copy and audit log.
 */
export async function enforceGuardrails(inputText: string): Promise<GuardrailScanResult> {
  if (!inputText || inputText.trim().length === 0) {
    return { sanitizedText: inputText || "", auditLog: [] };
  }

  let sanitizedText = inputText;
  const auditLog: ComplianceAuditItem[] = [];

  for (const rule of GUARDRAIL_PATTERNS) {
    const matches = sanitizedText.match(rule.pattern);
    if (matches && matches.length > 0) {
      for (const match of matches) {
        const rewritten = await rewriteWithLLM(match, rule.riskType, rule.defaultReplacement);

        auditLog.push({
          risk_detected: true,
          risk_type: rule.riskType,
          original_line: match,
          rewritten_line: rewritten,
          rationale: rule.rationale,
        });

        sanitizedText = sanitizedText.split(match).join(rewritten);
      }
    }
  }

  return {
    sanitizedText,
    auditLog,
  };
}
