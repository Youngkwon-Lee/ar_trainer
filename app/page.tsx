"use client";

import { HUDContainer } from "@/components/smart-glass/HUDContainer";
import { VideoFeed } from "@/components/smart-glass/VideoFeed";
import { MovementAnalysis } from "@/components/smart-glass/MovementAnalysis";
import { ActionClassification } from "@/components/smart-glass/ActionClassification";
import { AQADisplay } from "@/components/smart-glass/AQADisplay";
import { RecordingControls } from "@/components/smart-glass/RecordingControls";
import { RehabProvider, useRehab } from "@/context/RehabContext";

function SmartGlassInterface() {
  const { metrics } = useRehab();

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

          {/* Right: Additional Context */}
          <div className="flex flex-col items-end gap-2 text-right">
            <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 p-4 rounded-xl w-64">
              <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">Metrics</h3>
              <div className="flex justify-between text-sm text-white">
                <span className="text-cyan-200/70">Repetitions</span>
                <span className="font-mono text-xl text-cyan-400 font-bold">{metrics.reps}</span>
              </div>
              <div className="w-full h-[1px] bg-cyan-500/20 my-2" />
              <div className="flex justify-between text-sm text-white">
                <span className="text-cyan-200/70">Squat Depth</span>
                <span className="font-mono text-xl text-yellow-400">{metrics.squatDepth.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span className="text-yellow-400">Raw: {metrics.rawDiff?.toFixed(3)}</span>
                <span className="text-red-400">State: {metrics.countingState}</span>
              </div>
              <div className="w-full h-[1px] bg-cyan-500/20 my-2" />
              <div className="flex justify-between text-sm text-white">
                <span className="text-cyan-200/70">Target</span>
                <span className="font-mono text-xl">15</span>
              </div>
            </div>

            {/* Recording Controls */}
            <div className="mt-4">
              <RecordingControls />
            </div>
          </div>
        </div>
      </HUDContainer>
    </main>
  );
}

export default function Home() {
  return (
    <RehabProvider>
      <SmartGlassInterface />
    </RehabProvider>
  );
}
