"use client";

import { useRehab } from "@/context/RehabContext";
import { useEffect, useState } from "react";
import { X, Download, Activity, Clock, Trophy } from "lucide-react";

export default function ReportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { metrics } = useRehab();
    const { sessionStats } = metrics;

    if (!isOpen) return null;

    const durationSeconds = sessionStats.endTime && sessionStats.startTime
        ? Math.floor((sessionStats.endTime - sessionStats.startTime) / 1000)
        : 0;

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="w-6 h-6 text-cyan-400" />
                        Session Report
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Trophy className="w-4 h-4" /> Total Reps
                        </div>
                        <div className="text-3xl font-bold text-white">{sessionStats.totalReps}</div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Activity className="w-4 h-4" /> Max Depth
                        </div>
                        <div className="text-3xl font-bold text-yellow-400">{sessionStats.maxSquatDepth.toFixed(0)}</div>
                    </div>

                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 col-span-2">
                        <div className="flex items-center gap-2 text-slate-400 mb-1">
                            <Clock className="w-4 h-4" /> Duration
                        </div>
                        <div className="text-3xl font-bold text-emerald-400">{formatTime(durationSeconds)}</div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Close
                    </button>
                    <button
                        className="flex-1 py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        onClick={() => alert("Save to EMR Feature Coming Soon!")}
                    >
                        <Download className="w-4 h-4" /> Save Report
                    </button>
                </div>
            </div>
        </div>
    );
}
