"use client";

import React, { useState, useEffect } from "react";
import {
  GenerateCampaignResponse,
  AngleType,
  BrandDoc,
} from "@/types";
import {
  Sparkles,
  ShieldAlert,
  Send,
  Layers,
  CheckCircle2,
  Copy,
  BookOpen,
} from "lucide-react";

const ALL_ANGLES: AngleType[] = [
  "authority",
  "urgency",
  "curiosity",
  "proof",
  "fear-to-relief",
];

export function CampaignStudioTab({
  onCampaignGenerated,
}: {
  onCampaignGenerated?: (campaignId?: string) => void;
}) {
  const [brief, setBrief] = useState(
    "Launch our next-generation Autonomous Enterprise Workflow Orchestration suite for enterprise CTOs. We must promise guaranteed 10x ROI and provide a 100% cure for pipeline latency with zero risk."
  );
  const [campaignName, setCampaignName] = useState("Enterprise Q4 Expansion");
  const [brandDocs, setBrandDocs] = useState<BrandDoc[]>([]);
  const [selectedBrandDocId, setSelectedBrandDocId] = useState<string>("");
  const [selectedAngles, setSelectedAngles] = useState<AngleType[]>([
    "curiosity",
    "fear-to-relief",
    "urgency",
    "authority",
    "proof",
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateCampaignResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeChannelFilter, setActiveChannelFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/brand/ingest")
      .then((res) => res.json())
      .then((data) => {
        if (data.docs && data.docs.length > 0) {
          setBrandDocs(data.docs);
          setSelectedBrandDocId(data.docs[0].id);
        }
      })
      .catch((err) => console.error("Failed to load brand docs:", err));
  }, []);

  const toggleAngle = (angle: AngleType) => {
    if (selectedAngles.includes(angle)) {
      if (selectedAngles.length > 1) {
        setSelectedAngles(selectedAngles.filter((a) => a !== angle));
      }
    } else {
      setSelectedAngles([...selectedAngles, angle]);
    }
  };

  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/campaign/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignName,
          brief,
          brandDocId: selectedBrandDocId || undefined,
          targetAngles: selectedAngles,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        if (onCampaignGenerated) {
          onCampaignGenerated();
        }
      } else {
        alert("Generation failed: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAssets = result?.assets?.filter((a) =>
    activeChannelFilter === "all" ? true : a.channel === activeChannelFilter
  );

  return (
    <div className="space-y-6">
      {/* Campaign Controls Card */}
      <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              Campaign Studio & Multi-Channel Asset Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Input brief. OrbitApp enforces compliance guardrails, auto-rewrites risky claims, cites Brand Brain rules, and generates assets across all 5 channels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Brand Doc Selector */}
            <select
              value={selectedBrandDocId}
              onChange={(e) => setSelectedBrandDocId(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">Default Brand Brain</option>
              {brandDocs.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.fileName} ({doc.chunks?.length || 0} chunks)
                </option>
              ))}
            </select>

            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Campaign Name"
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 max-w-xs"
            />
          </div>
        </div>

        {/* Brief Textarea */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Campaign Brief (Includes compliance red-team tests like absolute ROI promises):
          </label>
          <textarea
            rows={3}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            className="w-full text-xs p-3.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
          />
        </div>

        {/* Psychological Angles Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            Target Psychological Angles:
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_ANGLES.map((angle) => {
              const active = selectedAngles.includes(angle);
              return (
                <button
                  key={angle}
                  onClick={() => toggleAngle(angle)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-500"
                      : "bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {angle}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !brief.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating & Enforcing Compliance...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Generate 5-Channel Brand-Compliant Campaign</span>
            </>
          )}
        </button>
      </div>

      {/* Generated Results View */}
      {result && (
        <div className="space-y-6">
          {/* Compliance Audit Log */}
          {result.compliance_audit && result.compliance_audit.length > 0 && (
            <div className="p-5 rounded-xl bg-amber-950/30 border border-amber-600/50 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                Compliance Guardrails Log: Proactive Rewrites Applied ({result.compliance_audit.length})
              </div>
              <div className="space-y-2">
                {result.compliance_audit.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/40 text-xs space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-red-900/60 text-red-300 font-mono text-[10px] uppercase">
                        {item.risk_type}
                      </span>
                      <span className="text-slate-400">Risk detected & overridden in accordance with Red-Team Law 1 & 2</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
                      <div className="p-2 rounded bg-slate-950/60 border border-red-900/30">
                        <span className="text-[10px] text-red-400 block font-semibold">ORIGINAL RISKY CLAIM:</span>
                        <span className="line-through text-red-300/80">{item.original_line}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-950/60 border border-emerald-900/30">
                        <span className="text-[10px] text-emerald-400 block font-semibold">COMPLIANT REPLACEMENT:</span>
                        <span className="text-emerald-300 font-medium">{item.rewritten_line}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-amber-200/80 italic">
                      Rationale: {item.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand Voice Summary */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <span className="text-xs text-slate-400 block font-medium">Brand Voice Summary Adhered To:</span>
              <p className="text-xs text-slate-200 italic">{result.brand_voice_summary}</p>
            </div>
          </div>

          {/* Channel Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" /> Channel:
            </span>
            {["all", "hook", "reel_script", "ad_copy", "email", "landing_page"].map((ch) => (
              <button
                key={ch}
                onClick={() => setActiveChannelFilter(ch)}
                className={`text-xs px-3 py-1 rounded-lg capitalize font-medium transition-colors ${
                  activeChannelFilter === ch
                    ? "bg-blue-600 text-white"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {ch.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Assets Grid */}
          <div className="grid grid-cols-1 gap-5">
            {filteredAssets?.map((asset) => (
              <div
                key={asset.id}
                className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-blue-900/50 transition-all space-y-3.5 shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-950 text-blue-400 border border-blue-800 text-xs font-bold uppercase tracking-wider">
                      {asset.channel.replace("_", " ")}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800 text-xs font-semibold capitalize">
                      Angle: {asset.angle}
                    </span>
                    {asset.isDuplicate && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-400 border border-amber-800 text-xs font-semibold">
                        Flagged Near-Duplicate (&gt;0.85)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => copyToClipboard(asset.id, asset.content)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/60"
                  >
                    {copiedId === asset.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Content Box */}
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 font-sans text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                  {asset.content}
                </div>

                {/* Citation Footer */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-300">Rule Cited:</span>
                    <span className="text-slate-400">{asset.brand_rule_cited}</span>
                  </div>
                  <span className="font-mono text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/30 self-start md:self-auto">
                    {asset.chunk_id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
