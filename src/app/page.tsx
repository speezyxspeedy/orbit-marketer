"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BrandBrainTab } from "@/components/BrandBrainTab";
import { CampaignStudioTab } from "@/components/CampaignStudioTab";
import { DedupeViewerTab } from "@/components/DedupeViewerTab";
import { ExperimentBanditTab } from "@/components/ExperimentBanditTab";
import {
  Sparkles,
  Cpu,
  CopyCheck,
  Zap,
  ShieldCheck,
  Layers,
  Activity,
  Terminal,
} from "lucide-react";

export default function OrbitMarketerDashboard() {
  const [activeTab, setActiveTab] = useState<string>("campaign");

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      {/* Top Enterprise Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  OrbitMarketer
                </span>
                <Badge
                  variant="default"
                  className="text-[10px] font-mono uppercase bg-blue-950 text-blue-400 border border-blue-800"
                >
                  v2.4 Enterprise
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400">
                Autonomous AI Campaign Engine for OrbitApp
              </p>
            </div>
          </div>

          {/* System Telemetry Badges */}
          <div className="hidden sm:flex items-center gap-3">
            <Badge variant="success" className="gap-1.5 py-1 px-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Compliance Guardrails: Active</span>
            </Badge>
            <Badge
              variant="outline"
              className="gap-1.5 py-1 px-3 border-blue-800/60 bg-blue-950/40 text-blue-300"
            >
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>Vector Store: Ready</span>
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Metric Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Brand Guardrails
              </span>
              <span className="text-sm font-bold text-slate-100">Law 1 & 2 Enforced</span>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Multi-Channel
              </span>
              <span className="text-sm font-bold text-slate-100">5 Required Channels</span>
            </div>
            <Layers className="w-5 h-5 text-blue-400 shrink-0" />
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Dedupe Threshold
              </span>
              <span className="text-sm font-bold text-slate-100">Cosine &gt; 0.85</span>
            </div>
            <CopyCheck className="w-5 h-5 text-indigo-400 shrink-0" />
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Experiment Safety
              </span>
              <span className="text-sm font-bold text-slate-100">N=100 Sample Lock</span>
            </div>
            <Zap className="w-5 h-5 text-amber-400 shrink-0" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full flex justify-start gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl overflow-x-auto">
            <TabsTrigger value="brand" className="gap-2 px-4 py-2 text-xs">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>1. Brand Brain (PDF & Chunks)</span>
            </TabsTrigger>

            <TabsTrigger value="campaign" className="gap-2 px-4 py-2 text-xs">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>2. Campaign Studio (5 Channels)</span>
            </TabsTrigger>

            <TabsTrigger value="dedupe" className="gap-2 px-4 py-2 text-xs">
              <CopyCheck className="w-4 h-4 text-indigo-400" />
              <span>3. Dedupe Matrix (&gt; 0.85)</span>
            </TabsTrigger>

            <TabsTrigger value="bandit" className="gap-2 px-4 py-2 text-xs">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>4. Experiment Engine (Bandit Split)</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Brand Brain */}
          <TabsContent value="brand">
            <BrandBrainTab />
          </TabsContent>

          {/* Tab 2: Campaign Studio */}
          <TabsContent value="campaign">
            <CampaignStudioTab />
          </TabsContent>

          {/* Tab 3: Dedupe & Review */}
          <TabsContent value="dedupe">
            <DedupeViewerTab />
          </TabsContent>

          {/* Tab 4: Experiment Engine */}
          <TabsContent value="bandit">
            <ExperimentBanditTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Enterprise Status Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-blue-500" />
            OrbitMarketer AI Engine • Connected to Local Vector Space & Firestore Schema
          </span>
          <span>OrbitApp Enterprise Brand Compliance Architecture</span>
        </div>
      </footer>
    </div>
  );
}
