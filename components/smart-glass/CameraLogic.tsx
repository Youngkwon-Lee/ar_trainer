"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRehab } from "@/context/RehabContext";

// Define simpler layout for POSE_CONNECTIONS since we can't import it
const POSE_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5],
    [5, 6], [6, 8], [9, 10], [11, 12], [11, 13],
    [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
    [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
    [18, 20], [11, 23], [12, 24], [23, 24], [23, 25],
    [24, 26], [25, 27], [26, 28], [27, 29], [28, 30],
    [29, 31], [30, 32], [27, 31], [28, 32]
];

export default function CameraLogic() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const requestRef = useRef<number | null>(null);
    const poseRef = useRef<any>(null);

    const { setPoseData, registerCaptureFn, metrics } = useRehab();
    const metricsRef = useRef(metrics);
    metricsRef.current = metrics; // Keep ref updated

    // Snapshot Logic
    useEffect(() => {
        const handleCapture = () => {
            if (!videoRef.current || !canvasRef.current || !poseRef.current) return;

            const video = videoRef.current;
            const skeletonCanvas = canvasRef.current;
            const width = video.videoWidth;
            const height = video.videoHeight;

            // Create offscreen canvas for composite
            const compositeCanvas = document.createElement("canvas");
            compositeCanvas.width = width;
            compositeCanvas.height = height;
            const ctx = compositeCanvas.getContext("2d");
            if (!ctx) return;

            // 1. Draw Video Frame
            ctx.drawImage(video, 0, 0, width, height);

            // 2. Draw Skeleton Overlay
            ctx.drawImage(skeletonCanvas, 0, 0, width, height);

            // 3. Generate Filename (timestamp)
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const filenameBase = `rehab_data_${timestamp}`;

            // 4. Download Image
            compositeCanvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${filenameBase}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, "image/png");

            // 5. Download Metadata (JSON)
            const metadata = {
                timestamp: new Date().toISOString(),
                metrics: metricsRef.current, // Use Ref to avoid dependency loop
                // In a real app, we might save raw landmarks too if available in state
            };
            const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" });
            const jsonUrl = URL.createObjectURL(jsonBlob);
            const j = document.createElement("a");
            j.href = jsonUrl;
            j.download = `${filenameBase}.json`;
            document.body.appendChild(j);
            j.click();
            document.body.removeChild(j);
            URL.revokeObjectURL(jsonUrl);
        };

        registerCaptureFn(handleCapture);
    }, [registerCaptureFn]); // Dependencies reduced. metrics removed.

    const onResults = (results: any) => {
        if (!canvasRef.current || !results.poseLandmarks) return;

        // Update Context with new landmarks
        setPoseData(results.poseLandmarks);

        const canvasCtx = canvasRef.current.getContext("2d");
        if (!canvasCtx) return;

        const { width, height } = canvasRef.current;
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, width, height);

        canvasCtx.fillStyle = "#FF0000";
        canvasCtx.strokeStyle = "#00FF00";
        canvasCtx.lineWidth = 2;

        if (results.poseLandmarks) {
            // Draw Connections
            POSE_CONNECTIONS.forEach(([start, end]) => {
                const first = results.poseLandmarks[start];
                const second = results.poseLandmarks[end];
                if (first && second) {
                    canvasCtx.beginPath();
                    canvasCtx.moveTo(first.x * width, first.y * height);
                    canvasCtx.lineTo(second.x * width, second.y * height);
                    canvasCtx.stroke();
                }
            });

            // Draw Landmarks
            results.poseLandmarks.forEach((landmark: any) => {
                canvasCtx.beginPath();
                canvasCtx.arc(landmark.x * width, landmark.y * height, 3, 0, 2 * Math.PI);
                canvasCtx.fill();
            });
        }
        canvasCtx.restore();
    };

    useEffect(() => {
        if (!scriptLoaded) return;

        // Initialize Video (No Webcam)
        if (videoRef.current) {
            // User provided test video
            videoRef.current.src = "/test-video.mp4";
            videoRef.current.crossOrigin = "anonymous";
            videoRef.current.play().then(() => {
                setCameraActive(true);
            }).catch(err => {
                console.error("Video play error:", err);
            });
        }

        // Initialize Pose
        // @ts-ignore
        const Pose = window.Pose;
        if (!Pose) return;

        const pose = new Pose({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });

        pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        pose.onResults(onResults);
        poseRef.current = pose;

        const detect = async () => {
            if (
                videoRef.current &&
                videoRef.current.readyState >= 2 &&
                !videoRef.current.paused
            ) {
                const video = videoRef.current;
                if (canvasRef.current) {
                    canvasRef.current.width = video.videoWidth;
                    canvasRef.current.height = video.videoHeight;
                }
                await pose.send({ image: video });
            }
            requestRef.current = requestAnimationFrame(detect);
        };

        detect();

        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
            if (poseRef.current) {
                poseRef.current.close();
            }
        };
    }, [scriptLoaded]);

    return (
        <>
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js"
                strategy="afterInteractive"
                onLoad={() => {
                    console.log("MediaPipe Pose script loaded");
                    setScriptLoaded(true);
                }}
            />

            <video
                ref={videoRef}
                loop
                muted
                playsInline
                crossOrigin="anonymous"
                className="absolute inset-0 h-full w-full object-cover opacity-60"
            />

            <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full object-cover"
            />

            {(!cameraActive || !scriptLoaded) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                    <span className="text-cyan-500 font-mono animate-pulse">
                        {!scriptLoaded ? "Loading AI Models..." : "Initializing Camera..."}
                    </span>
                </div>
            )}
        </>
    );
}
