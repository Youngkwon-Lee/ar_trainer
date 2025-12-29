"use client";

import { motion } from "framer-motion";

import { useRehab } from "@/context/RehabContext";

export const AQADisplay = () => {
    const { metrics } = useRehab();

    // Map squat depth (0-100) to AQA score or just use it directly
    const score = Math.round(metrics.squatDepth);
    const isValid = metrics.isGoodForm;

    // Circle circumference for stroke-dasharray
    const circumference = 2 * Math.PI * 40;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Background Circle */}
            <svg className="absolute w-full h-full rotate-[-90deg]">
                <circle
                    cx="64" cy="64" r="40"
                    fill="transparent"
                    stroke="#0e7490"
                    strokeWidth="8"
                    className="opacity-30"
                />
                {/* Progress Circle */}
                <circle
                    cx="64" cy="64" r="40"
                    fill="transparent"
                    stroke={isValid ? "#22d3ee" : "#f87171"} // Cyan if good, Red if bad
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out"
                />
            </svg>

            {/* Center Text */}
            <div className="flex flex-col items-center z-10">
                <span className="text-cyan-200/70 text-[10px] font-bold uppercase">Depth</span>
                <span className="text-white font-mono text-3xl font-bold shadow-black drop-shadow-lg">
                    {score}
                </span>
                <span className={`text-[10px] font-bold uppercase ${isValid ? "text-cyan-400" : "text-red-400"}`}>
                    {isValid ? "Good Form" : "Adjust"}
                </span>
            </div>

            {/* Outer Glow Ring */}
            <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-[spin_10s_linear_infinite]" />
        </div>
    );
};
