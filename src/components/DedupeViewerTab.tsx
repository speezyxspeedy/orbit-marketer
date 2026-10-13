"use client";

import React, { useState } from "react";
import { DedupeSimilarityItem } from "@/types";
import { CopyCheck, Sliders, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

export function DedupeViewerTab() {
  const [threshold, setThreshold] = useState<number>(0.85);
  const [loading, setLoading] = useState(false);
  const [matrix, setMatrix] = useState<DedupeSimilarityItem[]>([]);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [ranDedupe, setRanDedupe] = useState(false);

  const runDeduplication = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaign/dedupe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold }),
      });

      const data = await res.json();
      if (res.ok) {
        setMatrix(data.matrix || []);
        setDuplicateCount(data.duplicateCount || 0);
        setRanDedupe(true);
      } else {
        alert("Dedupe failed: " + data.error);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Banner */}
      <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <CopyCheck className="w-5 h-5 text-indigo-400" />
              Semantic Asset Deduplication & Similarity Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Computes pairwise Cosine Similarity across all generated asset vectors. Flags assets matching or exceeding the similarity threshold ({threshold}) to prevent audience creative fatigue.
            </p>
          </div>

          <button
            onClick={runDeduplication}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-md shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Computing Matrix..." : "Calculate Similarity Matrix"}</span>
          </button>
        </div>

        {/* Threshold Slider */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sliders className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-xs font-semibold text-slate-300">
                Similarity Threshold: <span className="text-indigo-400 font-mono font-bold">{threshold}</span>
              </span>
              <p className="text-[11px] text-slate-500">
                Assets with cosine similarity score ≥ {threshold} are marked as duplicates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-64">
            <input
              type="range"
              min="0.5"
              max="0.99"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Results View */}
      {ranDedupe && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3">
              {duplicateCount > 0 ? (
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{duplicateCount} Potential Duplicate(s) Detected Above Threshold</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>All Assets Distinct (No Duplicates Above {threshold})</span>
                </div>
              )}
            </div>
            <span className="text-xs text-slate-400">
              Evaluated {matrix.length} Pairwise Combinations
            </span>
          </div>

          {/* Matrix Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Asset A</th>
                    <th className="py-3 px-4">Asset B</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Cosine Similarity</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {matrix.map((row, i) => (
                    <tr
                      key={i}
                      className={row.isDuplicate ? "bg-amber-950/20" : "hover:bg-slate-800/30"}
                    >
                      <td className="py-3 px-4 text-slate-300">{row.assetAId}</td>
                      <td className="py-3 px-4 text-slate-300">{row.assetBId}</td>
                      <td className="py-3 px-4 text-blue-400 capitalize font-sans">{row.channel}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                row.isDuplicate ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, row.similarity * 100)}%` }}
                            />
                          </div>
                          <span
                            className={
                              row.isDuplicate ? "text-amber-400 font-bold" : "text-slate-300"
                            }
                          >
                            {(row.similarity * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-sans">
                        {row.isDuplicate ? (
                          <span className="px-2 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-semibold">
                            Duplicate (Filter)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-900 text-emerald-400 text-[10px]">
                            Unique
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
