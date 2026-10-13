"use client";

import React, { useState, useEffect } from "react";
import { BrandDoc } from "@/types";
import {
  UploadCloud,
  CheckCircle2,
  FileText,
  Cpu,
  Trash2,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Layers,
} from "lucide-react";

export function BrandBrainTab() {
  const [docs, setDocs] = useState<BrandDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [fileName, setFileName] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [replacePrevious, setReplacePrevious] = useState<boolean>(true);
  const [totalChunks, setTotalChunks] = useState<number>(0);

  const fetchDocs = async () => {
    try {
      const res = await fetch("/api/brand/ingest");
      const data = await res.json();
      if (data.docs) {
        setDocs(data.docs);
        setTotalChunks(data.totalChunks || 0);
      }
    } catch (err) {
      console.error("Failed to fetch brand docs:", err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatusMessage(`Uploading and vectorizing ${file.name}...`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("replacePrevious", replacePrevious ? "true" : "false");

      const res = await fetch("/api/brand/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage(data.message || `Ingested ${data.chunksCount} chunks.`);
        await fetchDocs();
      } else {
        setStatusMessage(`Error: ${data.error || "Upload failed"}`);
      }
    } catch (err: any) {
      setStatusMessage(`Upload failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;

    setLoading(true);
    setStatusMessage("Vectorizing brand text...");
    try {
      const res = await fetch("/api/brand/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: fileName.trim() || "custom_brand_voice.txt",
          content: textInput,
          replacePrevious,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage(data.message || `Ingested ${data.chunksCount} chunks.`);
        setTextInput("");
        setFileName("");
        await fetchDocs();
      } else {
        setStatusMessage(`Error: ${data.error || "Failed to ingest"}`);
      }
    } catch (err: any) {
      setStatusMessage(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeAll = async () => {
    if (!confirm("Are you sure you want to purge all active brand chunks from the vector store?")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/brand/ingest?all=true", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage("Purged all previous brand documents and vector chunks.");
        await fetchDocs();
      }
    } catch (err: any) {
      setStatusMessage(`Purge failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetToBaseline = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/brand/ingest?seed=true", { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage("Brand Brain reset to authoritative baseline guidelines.");
        await fetchDocs();
      }
    } catch (err: any) {
      setStatusMessage(`Reset failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/brand/ingest?docId=${docId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(`Document ${docId} and its vector chunks deleted.`);
        await fetchDocs();
      }
    } catch (err: any) {
      setStatusMessage(`Delete failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 border border-blue-900/30">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            Brand Brain & Vector Knowledge Ingestion
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Maintains the single source of truth for brand voice. Auto-chunks text (~300–500 tokens) and purges stale vectors to eliminate drift and bloat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetToBaseline}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span>Reset Baseline</span>
          </button>
          <button
            onClick={handlePurgeAll}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-xs text-red-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Purge All Chunks</span>
          </button>
          <button
            onClick={fetchDocs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-lg bg-blue-950/60 border border-blue-700/50 text-blue-200 text-sm flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs text-blue-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Lifecycle Mode Selector */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <div>
            <span className="text-xs font-bold text-slate-200 block">
              Chunk Lifecycle Strategy:
            </span>
            <span className="text-[11px] text-slate-400">
              {replacePrevious
                ? "Active: Replaces all previous chunks on ingestion to prevent vector bloat and drift."
                : "Active: Appending new chunks alongside existing brand vectors."}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setReplacePrevious(true)}
            className={`text-xs px-3 py-1 rounded-md font-semibold transition-all ${
              replacePrevious
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Replace Previous (Clean & Scalable)
          </button>
          <button
            onClick={() => setReplacePrevious(false)}
            className={`text-xs px-3 py-1 rounded-md font-semibold transition-all ${
              !replacePrevious
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Append Chunks
          </button>
        </div>
      </div>

      {/* Upload & Paste Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Upload Card */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-slate-200 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-400" />
              Upload Brand PDF
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports .pdf and .txt files. Text is parsed, segmented into ~300-500 word chunks, and vectorized.
            </p>
          </div>

          <div className="mt-5 border-2 border-dashed border-slate-700 hover:border-blue-500/70 rounded-xl p-6 text-center transition-colors bg-slate-950/40">
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf,.txt"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
            <label
              htmlFor="pdf-upload"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <FileText className="w-8 h-8 text-slate-400" />
              <span className="text-sm font-medium text-slate-300">
                Click to browse or drop brand PDF
              </span>
              <span className="text-xs text-slate-500">
                {replacePrevious ? "Will purge previous chunks on upload" : "Will append to existing chunks"}
              </span>
            </label>
          </div>
        </div>

        {/* Text Input Card */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <h3 className="font-semibold text-slate-200">Or Ingest Brand Guidelines Directly</h3>
          <input
            type="text"
            placeholder="Document label (e.g. Q4_Enterprise_Voice_Specs.txt)"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <textarea
            rows={4}
            placeholder="Paste tone guidelines, vocabulary policies, or value propositions..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="w-full text-xs p-3 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleTextSubmit}
            disabled={loading || !textInput.trim()}
            className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-xs font-semibold text-white transition-colors"
          >
            {loading ? "Processing Vectors..." : replacePrevious ? "Purge Previous & Ingest New Chunks" : "Append New Chunks"}
          </button>
        </div>
      </div>

      {/* Vector Chunks Status Viewer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Active Vector Store ({docs.length} Doc{docs.length === 1 ? "" : "s"} • {totalChunks} Total Chunks)
          </h3>
          <span className="text-xs text-slate-400">
            Vector Dimension: 128-d (Cosine Indexed)
          </span>
        </div>

        {docs.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-slate-500 text-sm">
            No brand chunks currently indexed. Upload a brand voice PDF above to populate the Brand Brain.
          </div>
        ) : (
          docs.map((doc) => (
            <div key={doc.id} className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-sm text-slate-100">{doc.fileName}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    ID: {doc.id}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {doc.chunks.length} Active Chunks
                  </span>
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="text-slate-400 hover:text-red-400 transition-colors p-1"
                    title="Delete this document and its chunks"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chunks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {doc.chunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-medium text-blue-400">
                        {chunk.id}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        Embedding Ready
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-3 font-normal leading-relaxed">
                      {chunk.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
