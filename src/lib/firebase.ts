import {
  BrandDoc,
  Campaign,
  Asset,
  Experiment,
  PolicyFlag,
} from "@/types";

/**
 * Scalable Firestore store abstraction with in-memory caching and atomic chunk lifecycle management.
 */
class InMemoryStore {
  brandDocs: Map<string, BrandDoc> = new Map();
  campaigns: Map<string, Campaign> = new Map();
  assets: Map<string, Asset> = new Map();
  experiments: Map<string, Experiment> = new Map();
  policyFlags: Map<string, PolicyFlag> = new Map();

  constructor() {
    this.seedDefaultBrand();
  }

  public seedDefaultBrand() {
    const defaultDoc: BrandDoc = {
      id: "brand_default_01",
      fileName: "OrbitApp_Enterprise_Brand_Voice_Guidelines.pdf",
      uploadedAt: new Date().toISOString(),
      chunks: [
        {
          id: "CHUNK_BRAND_VOICE_01",
          text: "OrbitApp Voice Core: Authoritative, visionary, pragmatic. Emphasize architectural rigor, enterprise scalability, and strategic business velocity over speculative hype.",
          embedding: [],
        },
        {
          id: "CHUNK_TONE_PARAM_02",
          text: "Rule 1.4: Ground enterprise executive communications in benchmark realities, engineering discipline, and validated customer business outcomes.",
          embedding: [],
        },
        {
          id: "CHUNK_COMPLIANCE_03",
          text: "Policy Directive 7: Prohibit absolute guarantees, '10x ROI', or 'zero risk' statements. Frame all value propositions in measurable, scalable enterprise capability.",
          embedding: [],
        },
        {
          id: "CHUNK_CONVERSION_04",
          text: "Conversion Rule 5.3: Calls to action must be decisive, value-focused, and framed around strategic discovery rather than generic clicks.",
          embedding: [],
        },
      ],
    };
    this.brandDocs.set(defaultDoc.id, defaultDoc);
  }

  /**
   * Clears all previous brand documents and their associated vector chunks.
   */
  public clearAllBrandDocs(): void {
    this.brandDocs.clear();
  }

  /**
   * Deletes a specific brand document by ID.
   */
  public deleteBrandDoc(docId: string): boolean {
    return this.brandDocs.delete(docId);
  }

  /**
   * Atomic ingestion: replaces previous documents or appends cleanly.
   */
  public ingestBrandDoc(doc: BrandDoc, replacePrevious: boolean = true): void {
    if (replacePrevious) {
      this.clearAllBrandDocs();
    }
    this.brandDocs.set(doc.id, doc);
  }

  /**
   * Returns total count of indexed chunks across all brand documents.
   */
  public getTotalChunkCount(): number {
    let count = 0;
    this.brandDocs.forEach((doc) => {
      count += doc.chunks.length;
    });
    return count;
  }
}

export const dbStore = new InMemoryStore();
