import { NextRequest, NextResponse } from "next/server";
import { DedupeSimilarityItem, DedupeAssetsResponse, CampaignAsset } from "@/types";
import { dedupeAssets } from "@/lib/embeddings";
import { db } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaignId, threshold = 0.85 } = body;

    const snapshot = await db.collection("assets").get();
    let targetAssets: CampaignAsset[] = snapshot.docs.map((d: any) => d.data() as CampaignAsset);

    if (campaignId) {
      targetAssets = targetAssets.filter((a) => a.campaignId === campaignId);
    }

    if (targetAssets.length < 2) {
      return NextResponse.json({
        campaignId: campaignId || "all",
        similarityThreshold: threshold,
        duplicateCount: 0,
        matrix: [],
        filteredAssetIds: targetAssets.map((a) => a.id),
      } satisfies DedupeAssetsResponse);
    }

    const dedupeResult = await dedupeAssets(targetAssets, [], threshold);

    const matrix: DedupeSimilarityItem[] = dedupeResult.matrix.map((m) => {
      const assetA = targetAssets.find((a) => a.id === m.assetAId);
      return {
        assetAId: m.assetAId,
        assetBId: m.assetBId,
        channel: assetA?.channel || "hook",
        similarity: m.similarity,
        isDuplicate: m.isDuplicate,
      };
    });

    const response: DedupeAssetsResponse = {
      campaignId: campaignId || "all",
      similarityThreshold: threshold,
      duplicateCount: dedupeResult.removed.length,
      matrix,
      filteredAssetIds: dedupeResult.kept.map((a) => a.id),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error("[OrbitApp] Dedupe error:", error);
    return NextResponse.json(
      { error: "Failed to perform asset deduplication", details: error?.message },
      { status: 500 }
    );
  }
}
