"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRehab } from "@/context/RehabContext";

// Define simpler layout for POSE_CONNECTIONS
const POSE_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5],
    [5, 6], [6, 8], [9, 10], [11, 12], [11, 13],
    [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
    [12, 14], [14, 16], [16, 18], [16, 20], [16, 22],
    [13, 18], [18, 20], [11, 23], [12, 24], [23, 24], [23, 25],
    [24, 26], [25, 27], [26, 28], [27, 29], [28, 30],
    [29, 31], [30, 32], [27, 31], [28, 32]
];

interface AnnotationCameraProps {
    isFrozen: boolean;
    onFrameCapture: (imageData: string) => void;
    clickedPoint: { x: number; y: number } | null;
    onPointClick: (x: number, y: number) => void;
}

export default function AnnotationCamera({ isFrozen, onFrameCapture, clickedPoint, onPointClick }: AnnotationCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const requestRef = useRef<number | null>(null);
    const poseRef = useRef<any>(null);

    const { setPoseData } = useRehab();

    // Handle Freeze/Unfreeze
    useEffect(() => {
        if (!videoRef.current) return;
        if (isFrozen) {
            videoRef.current.pause();
            // Capture the current frame as Base64 for saving
            if (canvasRef.current) {
                // Draw current video state to canvas first to ensure sync
                const ctx = canvasRef.current.getContext("2d");
                if (ctx) {
                    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                    // We might need to redraw skeleton? The loop stops so we need to ensure the last frame stays.
                }
                const dataUrl = canvasRef.current.toDataURL("image/png");
                onFrameCapture(dataUrl);
            }
        } else {
            videoRef.current.play();
        }
    }, [isFrozen]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isFrozen || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        onPointClick(x, y);
    };

    const onResults = (results: any) => {
        if (!canvasRef.current || !results.poseLandmarks) return;

        // If frozen, do not update landmarks or redraw (keep static)
        if (isFrozen) return;

        // Update Context with new landmarks
        setPoseData(results.poseLandmarks);

        const canvasCtx = canvasRef.current.getContext("2d");
        if (!canvasCtx) return;

        const { width, height } = canvasRef.current;
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, width, height);

        // Draw Video feed onto canvas (for saving later)
        // If we want to verify what we are clicking on, we should draw the video?
        // Actually CameraLogic overlays canvas ON TOP of video.
        // But for "freezing", the video element freezes.
        // We draw skeleton on top.

        // Draw Skeleton
        canvasCtx.lineWidth = 2;
        if (results.poseLandmarks) {
            // Connections
            canvasCtx.strokeStyle = "#00FF00";
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

            // Landmarks
            canvasCtx.fillStyle = "#FF0000";
            results.poseLandmarks.forEach((landmark: any) => {
                canvasCtx.beginPath();
                canvasCtx.arc(landmark.x * width, landmark.y * height, 3, 0, 2 * Math.PI);
                canvasCtx.fill();
            });
        }

        canvasCtx.restore();
    };

    // Draw Clicked Point Overlay (Effect)
    useEffect(() => {
        if (!isFrozen || !canvasRef.current || !clickedPoint) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        const { width, height } = canvasRef.current;
        const { x, y } = clickedPoint;

        ctx.save();
        // Don't clear rect, we want to draw ON TOP of the frozen skeleton/video
        // But if we clicked multiple times, we need to clear previous CLICK.
        // This suggests we need layers. 
        // For simplicity: We will just draw the point. If user clicks again, we might pile up unless we redraw scene.
        // To properly redraw scene, we needed to save the "Frozen Skeleton State". 
        // Let's keep it simple: Just draw a BIG CYAN CROSSHAIR.

        ctx.beginPath();
        ctx.strokeStyle = "#00FFFF";
        ctx.lineWidth = 3;
        const cx = x * width;
        const cy = y * height;
        ctx.moveTo(cx - 10, cy);
        ctx.lineTo(cx + 10, cy);
        ctx.moveTo(cx, cy - 10);
        ctx.lineTo(cx, cy + 10);
        ctx.stroke();

        ctx.restore();

    }, [clickedPoint]);


    useEffect(() => {
        if (!scriptLoaded) return;
        const startCamera = async () => {
            if (!videoRef.current) return;
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false
                });
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setCameraActive(true);
                };
            } catch (err) {
                console.error(err);
                alert("Camera access denied");
            }
        };
        startCamera();

        // @ts-ignore
        const Pose = window.Pose;
        if (!Pose) return;
        const pose = new Pose({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
        pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
        pose.onResults(onResults);
        poseRef.current = pose;

        const detect = async () => {
            if (videoRef.current && !videoRef.current.paused) {
                if (canvasRef.current) {
                    canvasRef.current.width = videoRef.current.videoWidth;
                    canvasRef.current.height = videoRef.current.videoHeight;
                }
                await pose.send({ image: videoRef.current });
            }
            requestRef.current = requestAnimationFrame(detect);
        };
        detect();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (poseRef.current) poseRef.current.close();
        };
    }, [scriptLoaded]);

    return (
        <>
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js"
                strategy="afterInteractive"
                onLoad={() => setScriptLoaded(true)}
            />
            <video ref={videoRef} loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />
            <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className={`absolute inset-0 h-full w-full object-cover ${isFrozen ? 'cursor-crosshair' : ''}`}
            />
            {(!cameraActive) && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-cyan-500">Initializing...</div>}
        </>
    );
}
