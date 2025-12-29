"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRehab } from "@/context/RehabContext";

export const MovementAnalysis = () => {
    // Real-time data from Context
    const { metrics } = useRehab();
    const [dataPoints, setDataPoints] = useState<number[]>(Array(20).fill(0));

    useEffect(() => {
        // Update graph with latest knee flexion angle
        setDataPoints(prev => {
            const newValue = metrics.kneeFlexionRight; // Visualize Right Knee
            return [...prev.slice(1), newValue];
        });
    }, [metrics]); // Update whenever metrics change

    return (
        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 p-4 rounded-xl w-64">
            <h3 className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Right Knee Flexion
            </h3>

            <div className="flex items-end h-24 gap-1">
                {dataPoints.map((val, i) => {
                    // Normalize for graph height (0-160 degrees mapped to 0-100%)
                    const heightPercent = Math.min(100, Math.max(0, (val / 160) * 100));
                    return (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPercent}%` }}
                            transition={{ type: "spring", bounce: 0, duration: 0.1 }}
                            className="flex-1 bg-gradient-to-t from-cyan-600 to-cyan-400 opacity-80 rounded-t-[1px]"
                        />
                    );
                })}
            </div>

            <div className="flex justify-between mt-2 text-[10px] text-cyan-200/60 font-mono">
                <span>0 deg</span>
                <span className="text-cyan-400 font-bold">{Math.round(metrics.kneeFlexionRight)}°</span>
                <span>160 deg</span>
            </div>
        </div>
    );
};
