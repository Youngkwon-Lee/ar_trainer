"use client";

import { motion } from "framer-motion";
import { useRehab } from "@/context/RehabContext";

export const ActionClassification = () => {
    const { metrics } = useRehab();

    return (
        <div className="flex items-center gap-4">
            <div className="bg-black/60 backdrop-blur-md border border-cyan-500/50 px-6 py-2 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider mr-2">Detected Action</span>
                <span className="text-white font-mono text-xl font-bold glow-text">
                    {metrics.actionLabel}
                </span>
            </div>

            <div className="bg-black/40 backdrop-blur-sm border border-cyan-500/30 px-3 py-1 rounded-full">
                <span className="text-cyan-200/70 text-[10px] font-bold uppercase mr-2">Confidence</span>
                <span className="text-cyan-400 font-mono text-sm">98.5%</span>
            </div>
        </div>
    );
};
