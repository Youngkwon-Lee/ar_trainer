"use client";

import { Activity, Database, Info } from "lucide-react";
import { HUDContainer } from "@/components/smart-glass/HUDContainer";
import { VideoFeed } from "@/components/smart-glass/VideoFeed";
import { MovementAnalysis } from "@/components/smart-glass/MovementAnalysis";
import { ActionClassification } from "@/components/smart-glass/ActionClassification";
import RecordingControls from "@/components/smart-glass/RecordingControls";
import { RehabProvider, useRehab } from "@/context/RehabContext";

function BenchPressHUD() {
    const { metrics } = useRehab();
    const { countingState, reps } = metrics;

    return (
        <main className="relative min-h-screen">
            {/* Background Video Simulation */}
            <VideoFeed />

            {/* Main HUD Layer */}
            <HUDContainer>
                {/* Top Section: Action Info */}
                <div className="flex justify-center pt-8">
                    <ActionClassification />
                </div>

                {/* Middle Section: Feedback Overlay */}
                <div className="flex-1 flex flex-col items-center justify-center pointer-events-none">
                    {metrics.feedback.length > 0 ? (
                        metrics.feedback.map((msg, i) => (
                            <div key={i} className="mb-2 bg-red-500/80 backdrop-blur-sm border border-red-400 px-6 py-2 rounded-full animate-bounce">
                                <span className="text-white font-bold tracking-widest uppercase text-xl shadow-black drop-shadow-md">
                                    ⚠ {msg}
                                </span>
                            </div>
                        ))
                    ) : (
                        // Show "Safe" indicator if form is good and active
                        metrics.isSessionActive && countingState === "DOWN" && (
                            <div className="mb-2 bg-emerald-500/50 backdrop-blur-sm border border-emerald-400 px-6 py-2 rounded-full">
                                <span className="text-white font-bold tracking-widest uppercase text-sm shadow-black drop-shadow-md">
                                    ✅ FORM LOOKS GOOD
                                </span>
                            </div>
                        )
                    )}
                </div>

                {/* Bottom Section: Analytics & Stats */}
                <div className="grid grid-cols-3 items-end gap-8 pb-8">
                    {/* Left: Graphs (Reused or Simplified for Bench) */}
                    <div className="flex flex-col gap-4">
                        {/* We can reuse MovementAnalysis if generic, or make a Bench specific one */}
                        <MovementAnalysis />
                        <div className="bg-slate-900/60 border border-slate-700 p-4 rounded-xl backdrop-blur-md">
                            <h3 className="text-slate-400 text-xs font-semibold uppercase mb-2 flex items-center gap-2">
                                <Info className="w-3 h-3" /> Bench Tips
                            </h3>
                            <ul className="text-slate-300 text-xs space-y-1">
                                <li>1. Keep elbows tucked (Arrow not T)</li>
                                <li>2. Push evenly with both arms</li>
                                <li>3. Full lockout at top</li>
                            </ul>
                        </div>
                    </div>

                    {/* Center: AQA or Metrics */}
                    <div className="flex justify-center -translate-y-8">
                        {/* Start/Status Indicator */}
                        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-8 py-4 flex flex-col items-center">
                            <span className="text-slate-400 text-xs uppercase tracking-widest mb-1">Current State</span>
                            <span className={`text-3xl font-black italic ${countingState === "DOWN" ? "text-amber-400" : "text-blue-400"}`}>
                                {countingState === "DOWN" ? "ECCENTRIC" : "LOCKED OUT"}
                            </span>
                        </div>
                    </div>

                    {/* Right Column: Metrics & Controls */}
                    <div className="flex flex-col gap-4">
                        {/* Metrics Panel */}
                        <div className="bg-slate-900/60 border border-slate-700 p-5 rounded-2xl backdrop-blur-md shadow-lg">
                            <h2 className="text-slate-400 text-sm font-semibold mb-3 uppercase tracking-wider flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Bench Analytics
                            </h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                    <span className="text-slate-500 text-xs block mb-1">Left Elbow</span>
                                    <span className="text-white font-mono text-lg">{metrics.elbowExtensionLeft.toFixed(0)}°</span>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                    <span className="text-slate-500 text-xs block mb-1">Right Elbow</span>
                                    <span className="text-white font-mono text-lg">{metrics.elbowExtensionRight.toFixed(0)}°</span>
                                </div>
                            </div>

                            <div className="mt-4 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between">
                                <span className="text-slate-500 text-xs">Total Reps</span>
                                <span className="text-4xl font-bold text-white self-center mt-2">{reps}</span>
                            </div>
                        </div>

                        {/* Recording & Session Controls */}
                        <div className="bg-slate-900/60 border border-slate-700 p-5 rounded-2xl backdrop-blur-md shadow-lg">
                            <h2 className="text-slate-400 text-sm font-semibold mb-3 uppercase tracking-wider flex items-center gap-2">
                                <Database className="w-4 h-4" /> Session Manager
                            </h2>
                            <RecordingControls />
                        </div>
                    </div>
                </div>
            </HUDContainer>
        </main>
    );
}

export default function BenchPage() {
    return (
        // Initialize RehabProvider with 'BENCH' mode
        <RehabProvider exercise="BENCH">
            <BenchPressHUD />
        </RehabProvider>
    );
}
