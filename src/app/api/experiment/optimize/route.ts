import { NextRequest, NextResponse } from "next/server";
import { Experiment, VariantMetric } from "@/types";
import { recommendNextTests } from "@/lib/bandit";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const snapshot = await db.collection("experiments").get();
    const experiments = snapshot.docs.map((d: any) => d.data());
    return NextResponse.json({ success: true, experiments }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch experiments", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/experiment/optimize (recommendNextTests)
 * Accepts { campaignId, variants }.
 * Executes recommendNextTests, updates 'experiments' collection in Firestore,
 * and returns { success: true, experimentId, status, budgetSplit, message }.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      campaignId = `camp_${Date.now()}`,
      variants = [],
      minSamples = 100,
    } = body;

    const formattedVariants: VariantMetric[] = variants.map(
      (v: any, index: number) => ({
        id: v.id || `variant_${String.fromCharCode(65 + index)}`,
        assetId: v.assetId || `asset_${index + 1}`,
        impressions: Number(v.impressions) || 0,
        conversions: Number(v.conversions) || 0,
      })
    );

    // Run bandit logic with N=100 sample-size safety lock
    const banditResult = recommendNextTests(formattedVariants, minSamples);

    const experimentId = body.experimentId || `exp_${campaignId}`;

    const experimentRecord: Experiment = {
      id: experimentId,
      campaignId,
      variants: formattedVariants,
      weights: banditResult.budgetSplit,
      status: banditResult.status,
    };

    // Update Firestore 'experiments' collection
    await db.collection("experiments").doc(experimentId).set(experimentRecord);

    return NextResponse.json(
      {
        success: true,
        experimentId,
        status: banditResult.status,
        budgetSplit: banditResult.budgetSplit,
        message: banditResult.rationale,
        analysis: {
          winnerVariantId: banditResult.winnerVariantId,
          totalImpressions: banditResult.totalImpressions,
          conversionRates: banditResult.conversionRates,
        },
        experiment: experimentRecord,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[OrbitApp] Experiment optimize error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to optimize experiment weights",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
