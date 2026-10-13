import { VariantMetric, BanditResult, VariantWeight } from "@/types";

export const DEFAULT_MIN_SAMPLE_THRESHOLD = 100;

/**
 * Multi-Armed Bandit Traffic & Budget Optimizer.
 *
 * RED-TEAM TEST 3 (Sample-Size Safety Lock):
 * If sum(impressions) < minSamples (default 100):
 * - Status MUST be locked to "COLLECTING_DATA"
 * - Traffic/budget MUST be equally partitioned
 * - Winner MUST remain null
 *
 * If sum(impressions) >= minSamples:
 * - Calculates CVR for each variant
 * - Shifts budget weights dynamically using Epsilon-Greedy allocation (80% exploit, 20% explore).
 */
export function recommendNextTests(
  variants: VariantMetric[],
  minSamples: number = DEFAULT_MIN_SAMPLE_THRESHOLD,
  epsilon: number = 0.2
): BanditResult {
  if (!variants || variants.length === 0) {
    return {
      status: "COLLECTING_DATA",
      budgetSplit: [],
      winnerVariantId: null,
      totalImpressions: 0,
      conversionRates: {},
      rationale: "No experiment variants provided.",
    };
  }

  const numVariants = variants.length;
  const totalImpressions = variants.reduce((sum, v) => sum + (v.impressions || 0), 0);

  const conversionRates: Record<string, number> = {};
  variants.forEach((v) => {
    const imps = v.impressions || 0;
    const convs = v.conversions || 0;
    const cvr = imps > 0 ? Number((convs / imps).toFixed(4)) : 0;
    v.cvr = cvr;
    conversionRates[v.id] = cvr;
  });

  const isSafetyLocked = totalImpressions < minSamples;

  if (isSafetyLocked) {
    const baseWeight = Number((100 / numVariants).toFixed(2));
    const remainder = Number((100 - baseWeight * numVariants).toFixed(2));

    const budgetSplit: VariantWeight[] = variants.map((v, idx) => ({
      variantId: v.id,
      weight: idx === 0 ? Number((baseWeight + remainder).toFixed(2)) : baseWeight,
      weightPercentage: idx === 0 ? Number((baseWeight + remainder).toFixed(2)) : baseWeight,
    }));

    return {
      status: "COLLECTING_DATA",
      budgetSplit,
      winnerVariantId: null,
      totalImpressions,
      conversionRates,
      rationale: `Safety Lock ACTIVE (Red-Team Law 3): Total impressions (${totalImpressions}) have not yet reached the required N=${minSamples} statistical threshold. Budget remains equally divided (${baseWeight}%) to prevent premature optimization.`,
    };
  }

  let bestVariant = variants[0];
  let highestCvr = conversionRates[variants[0].id] || 0;

  for (let i = 1; i < variants.length; i++) {
    const cvr = conversionRates[variants[i].id] || 0;
    if (cvr > highestCvr) {
      highestCvr = cvr;
      bestVariant = variants[i];
    }
  }

  const exploreWeight = (epsilon * 100) / numVariants;
  const exploitWeight = (1 - epsilon) * 100;

  const budgetSplit: VariantWeight[] = variants.map((v) => {
    const isWinner = v.id === bestVariant.id;
    const allocated = isWinner ? exploitWeight + exploreWeight : exploreWeight;
    return {
      variantId: v.id,
      weight: Number(allocated.toFixed(2)),
      weightPercentage: Number(allocated.toFixed(2)),
    };
  });

  const currentTotal = budgetSplit.reduce((acc, w) => acc + w.weight, 0);
  if (currentTotal !== 100 && budgetSplit.length > 0) {
    const diff = Number((100 - currentTotal).toFixed(2));
    budgetSplit[0].weight = Number((budgetSplit[0].weight + diff).toFixed(2));
    budgetSplit[0].weightPercentage = budgetSplit[0].weight;
  }

  const winningWeight = budgetSplit.find((w) => w.variantId === bestVariant.id)?.weight || 0;

  return {
    status: "OPTIMIZED",
    budgetSplit,
    winnerVariantId: bestVariant.id,
    totalImpressions,
    conversionRates,
    rationale: `Safety Lock PASSED: N=${totalImpressions} >= ${minSamples}. Champion variant ${bestVariant.id} achieved ${(highestCvr * 100).toFixed(2)}% CVR. Dynamic allocation routed ${winningWeight}% traffic to champion with ${epsilon * 100}% exploratory split across all variants.`,
  };
}

export const calculateBanditWeights = recommendNextTests;
