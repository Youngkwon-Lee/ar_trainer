"use client";

import { Activity, Database, Info, Move } from "lucide-react";
import { HUDContainer } from "@/components/smart-glass/HUDContainer";
import { VideoFeed } from "@/components/smart-glass/VideoFeed";
import { MovementAnalysis } from "@/components/smart-glass/MovementAnalysis";
import { ActionClassification } from "@/components/smart-glass/ActionClassification";
import RecordingControls from "@/components/smart-glass/RecordingControls";
import { RehabProvider, useRehab } from "@/context/RehabContext";

function DeadliftHUD() {
    const { metrics } = useRehab();
    const { countingState, reps } = metrics;

    // Utilize 'squatDepth' field which contains Trunk Angle for Deadlift
    const trunkAngle = metrics.squatDepth;
    // Utilize 'kneeFlexionLeft' which contains Active Leg Knee Angle
    const kneeAngle = metrics.kneeFlexionLeft;

    return (
        <main className="relative min-h-screen">
            <VideoFeed />
            <HUDContainer>
                {/* Top: Action Info */}
                <div className="flex justify-center pt-8">
                    <ActionClassification />
                </div>

                {/* Center: Feedback */}
                <div className="flex-1 flex flex-col items-center justify-center pointer-events-none">
                    {metrics.feedback.length > 0 && metrics.feedback.map((msg, i) => (
                        <div key={i} className="mb-2 bg-red-500/80 backdrop-blur-sm border border-red-400 px-6 py-2 rounded-full animate-bounce">
                            <span className="text-white font-bold tracking-widest uppercase text-xl shadow-black drop-shadow-md">
                                ⚠ {msg}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Bottom: Stats */}
                <div className="grid grid-cols-3 items-end gap-8 pb-8">
                    {/* Left: Tips */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-slate-900/60 border border-slate-700 p-4 rounded-xl backdrop-blur-md">
                            <h3 className="text-slate-400 text-xs font-semibold uppercase mb-2 flex items-center gap-2">
                                <Info className="w-3 h-3" /> RDL Safety
                            </h3>
                            <ul className="text-slate-300 text-xs space-y-1">
                                <li>1. <span className="text-amber-400">Push Hips Back</span> (Don't just bend)</li>
                                <li>2. Keep Bar touching legs</li>
                                <li>3. Chin tucked, Chest up</li>
                            </ul>
                        </div>
                    </div>

                    {/* Center: Angle Gauge */}
                    <div className="flex justify-center -translate-y-8">
                        <div className="bg-black/60 backdrop-blur-md border border-amber-500/30 rounded-full px-6 py-6 flex flex-col items-center w-40 h-40 justify-center relative">
                            <span className="text-slate-400 text-[10px] uppercase tracking-widest absolute top-6">Hip Hinge</span>
                            <span className="text-4xl font-bold text-white">{trunkAngle.toFixed(0)}°</span>
                            <div className="w-full bg-slate-700 h-1 mt-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-amber-500 h-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, (trunkAngle / 90) * 100)}%` }} // 90 deg = full bar
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Metrics */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-slate-900/60 border border-slate-700 p-5 rounded-2xl backdrop-blur-md shadow-lg">
                            <h2 className="text-slate-400 text-sm font-semibold mb-3 uppercase tracking-wider flex items-center gap-2">
                                <Activity className="w-4 h-4" /> Joint Angles
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                    <span className="text-slate-500 text-xs block mb-1">Knee Bend</span>
                                    <span className={`text-lg font-mono font-bold ${kneeAngle < 140 ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {kneeAngle.toFixed(0)}°
                                    </span>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex flex-col justify-between">
                                    <span className="text-slate-500 text-xs">Reps</span>
                                    <span className="text-3xl font-bold text-white self-end">{reps}</span>
                                </div>
                            </div>
                        </div>
                        <RecordingControls />
                    </div>
                </div>
            </HUDContainer>
        </main >
    );
}

export default function DeadliftPage() {
    return (
        <RehabProvider exercise="DEADLIFT">
            <DeadliftHUD />
        </RehabProvider>
    );
}
