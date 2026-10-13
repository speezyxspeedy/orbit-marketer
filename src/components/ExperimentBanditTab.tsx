"use client";

import React, { useState } from "react";
import { ExperimentVariant, VariantWeight } from "@/types";
import { Zap, Lock, Unlock, BarChart3, ArrowRight, Play } from "lucide-react";

export function ExperimentBanditTab() {
  const [variants, setVariants] = useState<ExperimentVariant[]>([
    { id: "variant_A", assetId: "asset_curiosity_01", impressions: 80, conversions: 8 },
    { id: "variant_B", assetId: "asset_authority_02", impressions: 120, conversions: 24 },
    { id: "variant_C", assetId: "asset_proof_03", impressions: 140, conversions: 35 },
  ]);
  const [minSampleSize, setMinSampleSize] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [weights, setWeights] = useState<VariantWeight[]>([
    { variantId: "variant_A", weight: 33.34 },
    { variantId: "variant_B", weight: 33.33 },
    { variantId: "variant_C", weight: 33.33 },
  ]);
  const [status, setStatus] = useState<string>("COLLECTING_DATA");
  const [rationale, setRationale] = useState<string>(
    "Safety lock ACTIVE: Variant A has not yet reached 100 impressions. Traffic remains evenly distributed."
  );

  const updateVariant = (index: number, field: "impressions" | "conversions", val: number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: Math.max(0, val) };
    setVariants(updated);
  };

  const runOptimization = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/experiment/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experimentId: "exp_live_01",
          variants,
          minSampleSize,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setWeights(data.budgetSplit || data.experiment?.weights || []);
        setStatus(data.status || data.experiment?.status || "COLLECTING_DATA");
        setRationale(data.message || data.analysis?.rationale || "Optimization completed.");
      } else {
        alert("Optimization failed: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Experiment Engine & Multi-Armed Bandit Traffic Allocator
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Dynamically partitions traffic using Epsilon-Greedy bandit mechanics with a deterministic sample-size safety lock to protect statistical validity.
            </p>
          </div>

          <button
            onClick={runOptimization}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-md shrink-0"
          >
            <Play className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>{loading ? "Optimizing..." : "Recalculate Bandit Weights"}</span>
          </button>
        </div>

        {/* Safety Lock Status Pill */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-3">
            {status === "COLLECTING_DATA" ? (
              <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/60 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Sample-Size Safety Lock: Active</span>
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-2">
                <Unlock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Safety Lock: Cleared & Optimized</span>
              </div>
            )}
            <span className="text-xs text-slate-400">
              Threshold: Minimum <span className="text-white font-semibold">{minSampleSize} impressions</span> per variant
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Lock Threshold:</span>
            <input
              type="number"
              value={minSampleSize}
              onChange={(e) => setMinSampleSize(parseInt(e.target.value) || 50)}
              className="w-20 text-xs px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Rationale Banner */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-400 shrink-0" />
        <span><strong className="text-slate-100">Engine Rationale:</strong> {rationale}</span>
      </div>

      {/* Variants & Traffic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {variants.map((v, i) => {
          const cvr = v.impressions > 0 ? ((v.conversions / v.impressions) * 100).toFixed(1) : "0.0";
          const weight = weights.find((w) => w.variantId === v.id)?.weight ?? weights.find((w) => w.variantId === v.id)?.weightPercentage ?? 0;
          const meetsLock = v.impressions >= minSampleSize;

          return (
            <div
              key={v.id}
              className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-lg hover:border-slate-700 transition-all"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-100">{v.id.replace("_", " ").toUpperCase()}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {v.assetId}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400">
                  {cvr}% CVR
                </span>
              </div>

              {/* Traffic Weight Visualizer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Traffic Allocation:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">{weight}%</span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${weight}%` }}
                  />
                </div>
              </div>

              {/* Metrics Inputs */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <label className="text-[10px] text-slate-400 block font-medium">Impressions</label>
                  <input
                    type="number"
                    value={v.impressions}
                    onChange={(e) => updateVariant(i, "impressions", parseInt(e.target.value) || 0)}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-medium">Conversions</label>
                  <input
                    type="number"
                    value={v.conversions}
                    onChange={(e) => updateVariant(i, "conversions", parseInt(e.target.value) || 0)}
                    className="w-full mt-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Sample threshold indicator */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Sample Goal:</span>
                {meetsLock ? (
                  <span className="text-emerald-400 font-medium">Lock Passed ({v.impressions}/{minSampleSize})</span>
                ) : (
                  <span className="text-amber-400 font-medium">Needs {minSampleSize - v.impressions} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
