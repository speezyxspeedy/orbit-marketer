import { GoogleGenAI } from "@google/genai";
import { CampaignAsset, DedupeResult } from "@/types";

/**
 * Initializes Google Gen AI SDK using GEMINI_API_KEY.
 */
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn("[OrbitApp] Failed to initialize Google Gen AI client:", err);
    return null;
  }
}

/**
 * Calculates Euclidean magnitude (L2 norm) of a vector.
 */
export function vectorMagnitude(vec: number[]): number {
  if (!vec || vec.length === 0) return 0;
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  return Math.sqrt(sumSq);
}

/**
 * Calculates dot product of two numerical vectors.
 */
export function dotProduct(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
  }
  return dot;
}

/**
 * Computes Cosine Similarity between two numerical vectors.
 * Returns a value between -1.0 and 1.0 (typically 0.0 to 1.0 for normalized text embeddings).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }
  const magA = vectorMagnitude(vecA);
  const magB = vectorMagnitude(vecB);
  if (magA === 0 || magB === 0) {
    return 0;
  }
  return dotProduct(vecA, vecB) / (magA * magB);
}

/**
 * Generates an embedding vector using Google Gemini model text-embedding-004.
 * Falls back to deterministic semantic hashing for sandbox / offline execution.
 */
export async function createEmbedding(text: string): Promise<number[]> {
  const sanitized = (text || "").replace(/\n+/g, " ").trim();
  if (!sanitized) {
    return new Array(128).fill(0);
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const response = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: sanitized,
      });

      const values =
        response.embeddings?.[0]?.values ||
        (response as unknown as { embedding?: { values?: number[] } }).embedding?.values;
      if (values && values.length > 0) {
        return values;
      }
    } catch (err) {
      console.warn("[OrbitApp] Gemini text-embedding-004 error, using fallback vector:", err);
    }
  }

  // Deterministic local semantic hash embedding fallback (128 dimensions)
  return generateDeterministicEmbedding(sanitized, 128);
}

export const getEmbedding = createEmbedding;
export const generateEmbedding = createEmbedding;

function generateDeterministicEmbedding(text: string, dimensions: number = 128): number[] {
  const vector = new Array(dimensions).fill(0);
  const words = text.toLowerCase().split(/\s+/);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash << 5) - hash + word.charCodeAt(c);
      hash |= 0;
    }
    const bucket = Math.abs(hash) % dimensions;
    const sign = hash % 2 === 0 ? 1 : -1;
    vector[bucket] += sign * (1 / Math.sqrt(i + 1));
  }

  const mag = vectorMagnitude(vector);
  return mag === 0 ? vector : vector.map((v) => v / mag);
}

/**
 * Deduplicates newly generated assets against existing assets and amongst themselves.
 * Returns { kept, removed } alongside full similarity matrix.
 */
export async function dedupeAssets(
  newAssets: CampaignAsset[],
  existingAssets: CampaignAsset[] = [],
  threshold: number = 0.85
): Promise<DedupeResult> {
  const duplicateAssets: Array<{
    asset: CampaignAsset;
    matchedAssetId: string;
    similarity: number;
  }> = [];

  const matrix: Array<{
    assetAId: string;
    assetBId: string;
    similarity: number;
    isDuplicate: boolean;
  }> = [];

  const duplicateIdSet = new Set<string>();

  for (const asset of newAssets) {
    if (!asset.embedding || asset.embedding.length === 0) {
      asset.embedding = await createEmbedding(asset.content);
    }
  }
  for (const asset of existingAssets) {
    if (!asset.embedding || asset.embedding.length === 0) {
      asset.embedding = await createEmbedding(asset.content);
    }
  }

  for (const newAsset of newAssets) {
    for (const existingAsset of existingAssets) {
      if (newAsset.id === existingAsset.id) continue;
      const sim = cosineSimilarity(newAsset.embedding, existingAsset.embedding);
      const isDupe = sim > threshold;

      matrix.push({
        assetAId: newAsset.id,
        assetBId: existingAsset.id,
        similarity: Number(sim.toFixed(4)),
        isDuplicate: isDupe,
      });

      if (isDupe && !duplicateIdSet.has(newAsset.id)) {
        duplicateIdSet.add(newAsset.id);
        newAsset.isDuplicate = true;
        newAsset.similarityScore = Number(sim.toFixed(4));
        duplicateAssets.push({
          asset: newAsset,
          matchedAssetId: existingAsset.id,
          similarity: Number(sim.toFixed(4)),
        });
      }
    }
  }

  for (let i = 0; i < newAssets.length; i++) {
    for (let j = i + 1; j < newAssets.length; j++) {
      const assetA = newAssets[i];
      const assetB = newAssets[j];
      const sim = cosineSimilarity(assetA.embedding, assetB.embedding);
      const isDupe = sim > threshold;

      matrix.push({
        assetAId: assetA.id,
        assetBId: assetB.id,
        similarity: Number(sim.toFixed(4)),
        isDuplicate: isDupe,
      });

      if (isDupe) {
        if (!duplicateIdSet.has(assetB.id)) {
          duplicateIdSet.add(assetB.id);
          assetB.isDuplicate = true;
          assetB.similarityScore = Number(sim.toFixed(4));
          duplicateAssets.push({
            asset: assetB,
            matchedAssetId: assetA.id,
            similarity: Number(sim.toFixed(4)),
          });
        }
      }
    }
  }

  const kept = newAssets.filter((a) => !duplicateIdSet.has(a.id));
  const removed = newAssets.filter((a) => duplicateIdSet.has(a.id));

  return {
    kept,
    removed,
    uniqueAssets: kept,
    duplicateAssets,
    matrix,
  };
}
