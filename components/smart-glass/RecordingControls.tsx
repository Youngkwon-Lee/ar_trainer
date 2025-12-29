"use client";

import { useState, useRef } from "react";
import { Camera, Mic, Square } from "lucide-react";
import { useRehab } from "@/context/RehabContext";

export const RecordingControls = () => {
    const { captureSnapshot } = useRehab();
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `voice_note_${new Date().toISOString().replace(/[:.]/g, "-")}.webm`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Microphone access denied. Cannot record audio.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Snapshot Button */}
            <button
                onClick={captureSnapshot}
                className="bg-black/40 backdrop-blur-md border border-cyan-500/30 p-4 rounded-full hover:bg-cyan-500/20 transition-all active:scale-95 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Camera className="w-6 h-6 text-cyan-400" />
            </button>

            {/* Audio Record Button */}
            <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-4 rounded-full backdrop-blur-md border transition-all active:scale-95 ${isRecording
                        ? "bg-red-500/20 border-red-500 animate-pulse"
                        : "bg-black/40 border-cyan-500/30 hover:bg-cyan-500/20"
                    }`}
            >
                {isRecording ? (
                    <Square className="w-6 h-6 text-red-500 fill-current" />
                ) : (
                    <Mic className="w-6 h-6 text-cyan-400" />
                )}
            </button>
        </div>
    );
};
