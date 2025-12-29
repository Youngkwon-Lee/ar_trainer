"use client";

import { useRehab } from "@/context/RehabContext";
import { useEffect, useState } from "react";

export default function RomGauge() {
    const { metrics } = useRehab();
    const { squatDepth, sessionStats, isSessionActive } = metrics;
    const maxDepth = sessionStats?.maxSquatDepth || 0;

    // Normalize depth (0-100) to angle (-90 to +90 degrees for semi-circle)
    // 0 depth -> -90 deg (left)
    // 100 depth -> +90 deg (right)
    const currentAngle = (squatDepth / 100) * 180 - 90;
    const maxAngle = (maxDepth / 100) * 180 - 90;

    return (
        <div className="relative w-48 h-24 flex items-end justify-center">
            {/* Background Arc */}
            <div className="absolute w-40 h-40 border-[12px] border-slate-700/50 rounded-full border-b-0 border-r-0 border-l-0" style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }}></div>

            {/* Target Zone Arc (example: >60 depth) */}
            <div className="absolute w-40 h-40 border-[12px] border-emerald-500/30 rounded-full"
                style={{
                    clipPath: "polygon(50% 50%, 100% 50%, 100% 0, 80% 0)", // Crude approximation, simpler to use SVG
                    transform: "rotate(0deg)"
                }}>
            </div>

            {/* SVG approach for better control */}
            <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 200 110">
                {/* Track */}
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />

                {/* Active Segment (gradient?) */}
                {/* Let's just use the needle for now, keeps it clean */}

                {/* Session Max Marker (Ghost) */}
                {isSessionActive && (
                    <line
                        x1="100" y1="100"
                        x2={100 + 80 * Math.cos((maxAngle - 90) * Math.PI / 180)}
                        y2={100 + 80 * Math.sin((maxAngle - 90) * Math.PI / 180)}
                        stroke="#f59e0b"
                        strokeWidth="4"
                        strokeDasharray="4 4"
                        opacity="0.7"
                    />
                )}
            </svg>

            {/* Needle */}
            <div
                className="absolute bottom-0 w-1 h-20 bg-cyan-400 origin-bottom rounded-full transition-transform duration-100 ease-out shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                style={{ transform: `rotate(${currentAngle}deg)` }}
            ></div>

            {/* Center Pivot */}
            <div className="absolute bottom-[-6px] w-4 h-4 bg-slate-200 rounded-full border-2 border-slate-900 z-10"></div>

            {/* Value Display */}
            <div className="absolute -bottom-8 text-center">
                <div className="text-xs text-slate-400 font-mono">ROM (Depth)</div>
                <div className="text-xl font-bold text-cyan-400 tabular-nums">
                    {squatDepth.toFixed(0)}
                    <span className="text-xs text-slate-500 ml-1">/ {maxDepth.toFixed(0)}</span>
                </div>
            </div>
        </div>
    );
}
