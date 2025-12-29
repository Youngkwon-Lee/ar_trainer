"use client";

import { useState, useRef } from "react";
import { Camera, Mic, Square, Play, BarChart2, Settings } from "lucide-react";
import { useRehab } from "@/context/RehabContext";
import ReportModal from "./ReportModal";
import CalibrationModal from "./CalibrationModal";

export default function RecordingControls() {
    const { captureSnapshot, startSession, endSession, metrics } = useRehab();
    const { isSessionActive } = metrics;

    // Audio State
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Report Logic
    const [showReport, setShowReport] = useState(false);
    const [showCalibration, setShowCalibration] = useState(false);

    // Audio Logic
    const toggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) audioChunksRef.current.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const a = document.createElement("a");
                    a.href = audioUrl;
                    a.download = `voice_note_${Date.now()}.webm`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorder.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Mic Error:", err);
                alert("Microphone access denied.");
            }
        }
    };

    const handleSessionToggle = () => {
        if (isSessionActive) {
            endSession(); // Stop tracking
            setShowReport(true); // Show report
        } else {
            startSession(); // Reset stats and start
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Session Button (Primary) */}
            <button
                onClick={handleSessionToggle}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg shadow-lg transition-all ${isSessionActive
                    ? "bg-red-500/20 text-red-400 border border-red-500 hover:bg-red-500/30"
                    : "bg-emerald-500 text-white hover:bg-emerald-400 border border-emerald-400 hover:scale-[1.02]"
                    }`}
            >
                {isSessionActive ? (
                    <> <Square className="fill-current w-5 h-5" /> Finish Session </>
                ) : (
                    <> <Play className="fill-current w-5 h-5" /> Start Session </>
                )}
            </button>

            <div className="grid grid-cols-2 gap-3">
                {/* Snapshot Button */}
                <button
                    onClick={() => {
                        captureSnapshot();
                        // Flash effect logic could go here
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-slate-800/60 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all active:scale-95 group"
                >
                    <Camera className="w-6 h-6 text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-slate-300 font-medium">Snapshot</span>
                </button>

                {/* Audio Record Button */}
                <button
                    onClick={toggleRecording}
                    className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all active:scale-95 group ${isRecording
                        ? "bg-red-500/20 border-red-500 animate-pulse"
                        : "bg-slate-800/60 border-slate-600 hover:bg-slate-700"
                        }`}
                >
                    <Mic className={`w-6 h-6 mb-1 transition-transform ${isRecording ? "text-red-500 scale-110" : "text-amber-400 group-hover:scale-110"}`} />
                    <span className={`text-xs font-medium ${isRecording ? "text-red-400" : "text-slate-300"}`}>
                        {isRecording ? "Recording..." : "Voice Note"}
                    </span>
                </button>
            </div>

            {/* Settings / Calibration Link */}
            <button
                onClick={() => setShowCalibration(true)}
                className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
                <Settings className="w-4 h-4" /> Calibrate Body (AI Tune)
            </button>

            {/* Modals */}
            <ReportModal isOpen={showReport} onClose={() => setShowReport(false)} />
            <CalibrationModal isOpen={showCalibration} onClose={() => setShowCalibration(false)} />
        </div>
    );
};
