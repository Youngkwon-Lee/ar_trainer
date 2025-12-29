"use client";

import { Activity, Database } from "lucide-react";
import { HUDContainer } from "@/components/smart-glass/HUDContainer";
import { VideoFeed } from "@/components/smart-glass/VideoFeed";
import { MovementAnalysis } from "@/components/smart-glass/MovementAnalysis";
import { ActionClassification } from "@/components/smart-glass/ActionClassification";
import { AQADisplay } from "@/components/smart-glass/AQADisplay";
import RecordingControls from "@/components/smart-glass/RecordingControls";
import RomGauge from "@/components/smart-glass/RomGauge";
import { RehabProvider, useRehab } from "@/context/RehabContext";

function SmartGlassInterface() {
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
                    {metrics.feedback.map((msg, i) => (
                        <div key={i} className="mb-2 bg-red-500/80 backdrop-blur-sm border border-red-400 px-6 py-2 rounded-full animate-bounce">
                            <span className="text-white font-bold tracking-widest uppercase text-xl shadow-black drop-shadow-md">
                                ⚠ {msg}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Bottom Section: Analytics & Stats */}
                <div className="grid grid-cols-3 items-end gap-8 pb-8">
                    {/* Left: Graphs */}
                    <div className="flex flex-col gap-4">
                        <MovementAnalysis />
                    </div>

                    {/* Center: AQA (Critical Info) */}
                    <div className="flex justify-center -translate-y-8">
                        <AQADisplay />
                    </div>

                    {/* Right Column: Metrics & Controls */}
                    <div className="flex flex-col gap-4">
                        {/* Metrics Panel */}
                        <div className="bg-slate-900/60 border border-slate-700 p-5 rounded-2xl backdrop-blur-md shadow-lg">
                            <h2 className="text-slate-400 text-sm font-semibold mb-3 uppercase tracking-wider flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Real-time Analysis
                            </h2>

                            {/* ROM Gauge */}
                            <div className="flex justify-center mb-6 pt-2">
                                <RomGauge />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                    <span className="text-slate-500 text-xs block mb-1">State</span>
                                    <span className={`text-lg font-bold ${countingState === "DOWN" ? "text-emerald-400" : "text-white"}`}>
                                        {countingState}
                                    </span>
                                </div>
                                {/* Reps Visualization */}
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between">
                                    <span className="text-slate-500 text-xs">Total Reps</span>
                                    <span className="text-3xl font-bold text-white self-end">{reps}</span>
                                </div>
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

export default function SquatPage() {
    return (
        <RehabProvider>
            <SmartGlassInterface />
        </RehabProvider>
    );
}
