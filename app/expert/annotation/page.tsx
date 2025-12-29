"use client";

import { useState } from "react";
import { ArrowLeft, Save, MousePointer2, Play, Pause } from "lucide-react";
import Link from "next/link";
import AnnotationCamera from "@/components/expert/AnnotationCamera";
import { RehabProvider, useRehab } from "@/context/RehabContext";

function AnnotationTool() {
    const { landmarks } = useRehab();
    const [isFrozen, setIsFrozen] = useState(false);
    const [clickedPoint, setClickedPoint] = useState<{ x: number; y: number } | null>(null);
    const [dataset, setDataset] = useState<any[]>([]);
    const [lastFrameImage, setLastFrameImage] = useState<string | null>(null);

    const toggleFreeze = () => {
        if (isFrozen) {
            // Unfreeze
            setIsFrozen(false);
            setClickedPoint(null);
        } else {
            // Freeze
            setIsFrozen(true);
        }
    };

    const handlePointClick = (x: number, y: number) => {
        setClickedPoint({ x, y });
    };

    const handleSavePoint = () => {
        if (!clickedPoint || !landmarks) return;

        const dataEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            landmarks: landmarks, // Current MediaPipe landmarks
            manual_labels: {
                lumbar_l3: clickedPoint // The Ground Truth
            },
            // In a real app, we would upload the image here (lastFrameImage)
            // image_base64: lastFrameImage 
        };

        setDataset(prev => [...prev, dataEntry]);

        // Auto-resume after save
        setIsFrozen(false);
        setClickedPoint(null);
    };

    const handleExport = () => {
        const jsonString = JSON.stringify(dataset, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `lumbar_dataset_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <main className="min-h-screen bg-black text-white relative">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white">
                    <ArrowLeft className="w-5 h-5" /> Back
                </Link>
                <div className="flex gap-4">
                    <div className="bg-slate-800 px-4 py-1 rounded-full text-xs font-mono">
                        Samples: {dataset.length}
                    </div>
                    <button onClick={handleExport} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-4 py-1 rounded-full text-sm font-bold">
                        <Save className="w-4 h-4" /> Export JSON
                    </button>
                </div>
            </div>

            {/* Camera View */}
            <div className="absolute inset-0">
                <AnnotationCamera
                    isFrozen={isFrozen}
                    clickedPoint={clickedPoint}
                    onPointClick={handlePointClick}
                    onFrameCapture={setLastFrameImage}
                />
            </div>

            {/* Controls Overlay */}
            <div className="absolute bottom-10 left-0 w-full flex justify-center gap-6 z-20">
                {!isFrozen ? (
                    <button
                        onClick={toggleFreeze}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)] group-hover:scale-110 transition">
                            <Pause className="w-8 h-8 fill-white" />
                        </div>
                        <span className="text-sm font-bold tracking-widest uppercase">Freeze Frame</span>
                    </button>
                ) : (
                    <div className="flex gap-4">
                        <button
                            onClick={toggleFreeze}
                            className="bg-slate-600 hover:bg-slate-500 px-6 py-3 rounded-full font-bold"
                        >
                            Cancel
                        </button>
                        {clickedPoint && (
                            <button
                                onClick={handleSavePoint}
                                className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                            >
                                <Save className="w-5 h-5" /> Save Lumbar Point
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Instruction Overlay */}
            {isFrozen && !clickedPoint && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="bg-black/60 backdrop-blur-md border border-cyan-500/50 p-6 rounded-2xl text-center">
                        <MousePointer2 className="w-10 h-10 text-cyan-400 mx-auto mb-2 animate-bounce" />
                        <h2 className="text-xl font-bold text-white">Click on the Lumbar (L3)</h2>
                        <p className="text-slate-300 text-sm">Ideally between the lowest rib and pelvis.</p>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function AnnotationPage() {
    return (
        <RehabProvider>
            <AnnotationTool />
        </RehabProvider>
    );
}
