"use client";

import { useRehab } from "@/context/RehabContext";
import { useState } from "react";
import { X, Check, ArrowDown, ArrowUp, Ruler } from "lucide-react";

export default function CalibrationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const { calibrate, resetCalibration, calibrationData, metrics } = useRehab();
    const [step, setStep] = useState<"INTRO" | "STAND" | "SQUAT" | "DONE">("INTRO");

    if (!isOpen) return null;

    const handleStand = () => {
        calibrate("STANDING");
        setStep("SQUAT");
    };

    const handleSquat = () => {
        calibrate("SQUAT");
        setStep("DONE");
    };

    const handleReset = () => {
        resetCalibration();
        setStep("INTRO");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 mb-3">
                        <Ruler className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Body Calibration</h2>
                    <p className="text-slate-400 text-sm mt-1">Adjust AI to your body size</p>
                </div>

                {/* Steps */}
                <div className="space-y-6">
                    {step === "INTRO" && (
                        <div className="text-center">
                            <p className="text-slate-300 mb-6">
                                Everyone's body is different. Calibrate the AI to recognize
                                <strong> YOUR full range of motion</strong> for accurate counting.
                            </p>
                            <button
                                onClick={() => setStep("STAND")}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition"
                            >
                                Start Setup
                            </button>
                        </div>
                    )}

                    {step === "STAND" && (
                        <div className="text-center">
                            <div className="mb-6 mx-auto w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-2 border-emerald-500/50 animate-pulse">
                                <ArrowUp className="w-10 h-10 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Step 1: Stand Straight</h3>
                            <p className="text-slate-400 mb-6">
                                Stand in a comfortable upright position. <br />
                                Make sure the camera sees your full body.
                            </p>
                            <button
                                onClick={handleStand}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition"
                            >
                                Capture Standing Pose
                            </button>
                            <div className="mt-4 text-xs text-slate-500">
                                Current Diff: {metrics.rawDiff.toFixed(3)}
                            </div>
                        </div>
                    )}

                    {step === "SQUAT" && (
                        <div className="text-center">
                            <div className="mb-6 mx-auto w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-2 border-amber-500/50 animate-pulse">
                                <ArrowDown className="w-10 h-10 text-amber-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Step 2: Squat Down</h3>
                            <p className="text-slate-400 mb-6">
                                Squat down to your maximum comfortable depth. <br />
                                Hold that position.
                            </p>
                            <button
                                onClick={handleSquat}
                                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-lg transition"
                            >
                                Capture Squat Pose
                            </button>
                            <div className="mt-4 text-xs text-slate-500">
                                Current Diff: {metrics.rawDiff.toFixed(3)}
                            </div>
                        </div>
                    )}

                    {step === "DONE" && (
                        <div className="text-center">
                            <div className="mb-6 mx-auto w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center border-2 border-indigo-500">
                                <Check className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Calibration Complete!</h3>
                            <p className="text-slate-400 mb-6">
                                Your range of motion has been saved. <br />
                                Squat counting will now be personalized.
                            </p>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-slate-800 p-3 rounded-lg">
                                    <div className="text-xs text-slate-500">Standing Diff</div>
                                    <div className="text-lg font-mono text-emerald-400">{calibrationData?.standingDiff.toFixed(3)}</div>
                                </div>
                                <div className="bg-slate-800 p-3 rounded-lg">
                                    <div className="text-xs text-slate-500">Squat Diff</div>
                                    <div className="text-lg font-mono text-amber-400">{calibrationData?.squatDiff.toFixed(3)}</div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium"
                                >
                                    Redo
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold"
                                >
                                    Get Started
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
