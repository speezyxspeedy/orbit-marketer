import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

/**
 * Initializes Firebase Admin SDK using environment variables:
 * - FIREBASE_PROJECT_ID / PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL / CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY / PRIVATE_KEY
 */

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.CLIENT_EMAIL;
const rawKey = process.env.FIREBASE_PRIVATE_KEY || process.env.PRIVATE_KEY;
const privateKey = rawKey ? rawKey.replace(/\\n/g, "\n") : undefined;

let firestoreInstance: Firestore | null = null;

if (projectId && clientEmail && privateKey) {
  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
    firestoreInstance = getFirestore();
  } catch (error) {
    console.warn("[OrbitApp] Firebase Admin initialization failed, falling back to local memory store:", error);
  }
}

// In-Memory Fallback Adapter ensuring resilience in offline/sandbox environments
class InMemoryFirestore {
  private data: Map<string, Map<string, any>> = new Map();

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    const brandMap = new Map();
    brandMap.set("brand_default_01", {
      id: "brand_default_01",
      fileName: "OrbitApp_Enterprise_Brand_Guidelines.pdf",
      uploadedAt: new Date().toISOString(),
      chunks: [
        {
          id: "CHUNK_BRAND_VOICE_01",
          text: "OrbitApp Voice Core: Authoritative, visionary, pragmatic. Emphasize architectural rigor, enterprise scalability, and strategic business velocity over speculative hype.",
          embedding: [],
        },
        {
          id: "CHUNK_TONE_PARAM_02",
          text: "Rule 1.4: Ground enterprise communications in benchmark realities, engineering discipline, and validated customer business outcomes.",
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
    });
    this.data.set("brand_docs", brandMap);
    this.data.set("campaigns", new Map());
    this.data.set("assets", new Map());
    this.data.set("experiments", new Map());
    this.data.set("policy_flags", new Map());
  }

  collection(name: string) {
    if (!this.data.has(name)) {
      this.data.set(name, new Map());
    }
    const col = this.data.get(name)!;

    return {
      doc: (id: string) => ({
        id,
        get: async () => {
          const val = col.get(id);
          return {
            exists: val !== undefined,
            id,
            data: () => val,
          };
        },
        set: async (docData: any) => {
          col.set(id, { ...docData, id });
          return { writeTime: new Date() };
        },
        delete: async () => {
          col.delete(id);
          return { writeTime: new Date() };
        },
      }),
      get: async () => {
        const docs = Array.from(col.values()).map((val) => ({
          id: val.id,
          data: () => val,
        }));
        return {
          docs,
          empty: docs.length === 0,
          size: docs.length,
        };
      },
      add: async (docData: any) => {
        const id = docData.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const record = { ...docData, id };
        col.set(id, record);
        return {
          id,
          get: async () => ({
            exists: true,
            id,
            data: () => record,
          }),
        };
      },
    };
  }

  batch() {
    const operations: Array<() => void> = [];
    return {
      set: (docRef: any, data: any) => {
        operations.push(() => docRef.set(data));
      },
      commit: async () => {
        for (const op of operations) {
          op();
        }
        return [];
      },
    };
  }
}

export const inMemoryDb = new InMemoryFirestore();

export const getFirestoreDb = () => {
  if (firestoreInstance) {
    return firestoreInstance;
  }
  return inMemoryDb as unknown as Firestore;
};

export const db = getFirestoreDb();
export const adminDb = db;
