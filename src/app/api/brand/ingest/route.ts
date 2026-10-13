import { NextRequest, NextResponse } from "next/server";
import { BrandDoc, BrandChunk } from "@/types";
import { getEmbedding } from "@/lib/embeddings";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
  try {
    const snapshot = await db.collection("brand_docs").get();
    const docs: BrandDoc[] = snapshot.docs.map((d: any) => d.data() as BrandDoc);
    const totalChunks = docs.reduce((acc, d) => acc + (d.chunks ? d.chunks.length : 0), 0);

    return NextResponse.json(
      { success: true, docs, totalDocs: docs.length, totalChunks, status: "READY" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to retrieve brand documents", details: error?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("docId");

    if (docId) {
      await db.collection("brand_docs").doc(docId).delete();
      return NextResponse.json({ success: true, message: `Document '${docId}' deleted successfully.` });
    }

    const snapshot = await db.collection("brand_docs").get();
    for (const d of snapshot.docs) {
      await db.collection("brand_docs").doc(d.id).delete();
    }

    return NextResponse.json({
      success: true,
      message: "All previous brand documents and vector chunks have been purged.",
      purgedCount: snapshot.docs.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: "Failed to purge brand documents", details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/brand/ingest (ingestBrandDoc)
 * Multipart form handler for PDF upload -> extract text -> chunk into ~400 word segments -> generate embeddings -> save to brand_docs.
 * Returns { success: true, docId, chunksIndexed }.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let fileName = "uploaded_brand_voice.txt";
    let rawText = "";

    // 1. Multipart Form-Data Upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No file provided in form-data payload." },
          { status: 400 }
        );
      }

      fileName = file.name;

      if (file.name.toLowerCase().endsWith(".pdf")) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        try {
          const pdfParse = (await import("pdf-parse")).default;
          const parsed = await pdfParse(buffer);
          rawText = parsed.text;
        } catch (pdfErr: any) {
          console.warn("[OrbitApp] pdf-parse fallback triggered:", pdfErr?.message);
          rawText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n]/g, " ");
        }
      } else {
        rawText = await file.text();
      }
    } else {
      // JSON Payload Fallback
      const body = await req.json();
      fileName = body.fileName?.trim() || "brand_guidelines.txt";
      rawText = (body.content || body.text || "").trim();
    }

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Document text is empty or could not be parsed." },
        { status: 400 }
      );
    }

    // 2. Semantic Chunking (~400 words per segment)
    const paragraphs = rawText
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    const docId = `brand_${Date.now()}`;
    const chunks: BrandChunk[] = [];
    let currentChunkText = "";
    let chunkIndex = 1;

    for (const paragraph of paragraphs) {
      const combinedWords = (currentChunkText + " " + paragraph).split(/\s+/).length;

      if (combinedWords > 400 && currentChunkText.length > 0) {
        const embedding = await getEmbedding(currentChunkText);
        chunks.push({
          id: `CHUNK_${docId}_${chunkIndex++}`,
          text: currentChunkText.trim(),
          embedding,
        });
        currentChunkText = paragraph;
      } else {
        currentChunkText = currentChunkText ? `${currentChunkText}\n\n${paragraph}` : paragraph;
      }
    }

    // Tail chunk
    if (currentChunkText.trim().length > 0) {
      const embedding = await getEmbedding(currentChunkText);
      chunks.push({
        id: `CHUNK_${docId}_${chunkIndex++}`,
        text: currentChunkText.trim(),
        embedding,
      });
    }

    // 3. Save to Firestore collection 'brand_docs'
    const brandDocRecord: BrandDoc = {
      id: docId,
      fileName,
      uploadedAt: new Date().toISOString(),
      chunks,
    };

    await db.collection("brand_docs").doc(docId).set(brandDocRecord);

    return NextResponse.json(
      {
        success: true,
        docId,
        chunksIndexed: chunks.length,
        fileName,
        message: "Brand document successfully ingested, chunked, and vectorized.",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[OrbitApp] Brand ingestion error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to ingest brand document",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
