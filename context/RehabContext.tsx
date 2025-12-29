"use client";

import { createContext, useContext, useState, useRef, ReactNode, useCallback } from "react";

// Simplified Landmark Type (based on MediaPipe)
export interface Landmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
}

export interface RehabMetrics {
    kneeFlexionLeft: number;
    kneeFlexionRight: number;
    squatDepth: number;
    isGoodForm: boolean;
    actionLabel: string;
    reps: number;
    feedback: string[];
    // Debug metrics
    rawDiff: number;
    countingState: string;
}

interface RehabContextType {
    landmarks: Landmark[] | null;
    metrics: RehabMetrics;
    setPoseData: (landmarks: Landmark[]) => void;
    registerCaptureFn: (fn: () => void) => void;
    captureSnapshot: () => void;
}

const RehabContext = createContext<RehabContextType | undefined>(undefined);

// Helper to calculate angle between 3 points
const calculateAngle = (a: Landmark, b: Landmark, c: Landmark) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
};

export function RehabProvider({ children }: { children: ReactNode }) {
    const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
    const captureFnRef = useRef<(() => void) | null>(null);
    const [metrics, setMetrics] = useState<RehabMetrics>({
        kneeFlexionLeft: 180,
        kneeFlexionRight: 180,
        squatDepth: 0,
        isGoodForm: true,
        actionLabel: "STANDING",
        reps: 0,
        feedback: [],
        rawDiff: 0,
        countingState: "INIT"
    });

    // State for counting
    const wasSquattingRef = useRef(false);
    const lastUpdateRef = useRef(0);

    // Optimize: Wrap in useCallback to prevent consumer re-renders
    const setPoseData = useCallback((newLandmarks: Landmark[]) => {
        // PERF FIX: Do NOT update state with raw landmarks on every frame (60fps). 
        // This causes "Maximum update depth" crashes.
        // Components that need raw landmarks should use a Ref or direct callback.
        // setLandmarks(newLandmarks); 

        const now = Date.now();
        // Throttle METRICS updates to ~100ms (10fps) prevents "Maximum update depth"
        // while allowing smooth visual overlay.
        if (now - lastUpdateRef.current < 100) return;
        lastUpdateRef.current = now;

        if (newLandmarks.length > 28) {
            // --- 1. Basic Metrics ---
            const leftKneeAngle = calculateAngle(newLandmarks[23], newLandmarks[25], newLandmarks[27]);
            const rightKneeAngle = calculateAngle(newLandmarks[24], newLandmarks[26], newLandmarks[28]);

            const hipY = (newLandmarks[23].y + newLandmarks[24].y) / 2;
            const kneeY = (newLandmarks[25].y + newLandmarks[26].y) / 2;

            // Normalize
            const diff = kneeY - hipY;
            let squatDepth = (0.3 - diff) * (100 / 0.3);
            squatDepth = Math.max(0, Math.min(100, squatDepth));

            // DEBUG: Log values to console
            // console.log(`Depth: ${squatDepth.toFixed(0)} | Diff: ${diff.toFixed(3)} | State: ${wasSquattingRef.current ? "DOWN" : "UP"}`);

            // --- 2. Action & Counting ---
            const isSquattingCurrent = squatDepth > 50;
            const actionLabel = isSquattingCurrent ? "SQUAT" : "STANDING";

            // --- 3. Advanced Feedback ---
            const feedbackMessages: string[] = [];

            // A. Knee Valgus
            const kneeDist = Math.abs(newLandmarks[25].x - newLandmarks[26].x);
            const ankleDist = Math.abs(newLandmarks[27].x - newLandmarks[28].x);
            if (isSquattingCurrent && (kneeDist / ankleDist) < 0.7) feedbackMessages.push("KNEES INWARD");

            // B. Trunk Lean
            const shoulderY = (newLandmarks[11].y + newLandmarks[12].y) / 2;
            const shoulderX = (newLandmarks[11].x + newLandmarks[12].x) / 2;
            const midHipY = hipY;
            const midHipX = (newLandmarks[23].x + newLandmarks[24].x) / 2;
            const dx = shoulderX - midHipX;
            const dy = shoulderY - midHipY;
            const trunkAngle = Math.abs(Math.atan2(dx, -dy) * 180 / Math.PI);
            if (isSquattingCurrent && trunkAngle > 45) feedbackMessages.push("CHEST FORWARD");

            // LOGIC: Update State Machine & Refs BEFORE setMetrics
            // Adjusted Thresholds: Stand < 65 (User avg ~53)
            let increment = 0;
            let currentCountingState = wasSquattingRef.current ? "DOWN" : "UP";

            if (!wasSquattingRef.current && squatDepth > 65) {
                wasSquattingRef.current = true;
                currentCountingState = "DOWN";
            } else if (wasSquattingRef.current && squatDepth < 65) {
                wasSquattingRef.current = false;
                currentCountingState = "UP";
                increment = 1;
                // console.log("!!! REP COUNTED !!!"); // Explicit log for counting
            }

            // SINGLE State Update
            setMetrics(prev => ({
                kneeFlexionLeft: leftKneeAngle,
                kneeFlexionRight: rightKneeAngle,
                squatDepth,
                isGoodForm: feedbackMessages.length === 0,
                actionLabel,
                reps: prev.reps + increment,
                feedback: feedbackMessages,
                rawDiff: diff,
                countingState: currentCountingState
            }));
        }
    }, []);

    const registerCaptureFn = useCallback((fn: () => void) => {
        captureFnRef.current = fn;
    }, []);

    const captureSnapshot = useCallback(() => {
        if (captureFnRef.current) {
            captureFnRef.current();
        } else {
            console.warn("No capture function registered");
        }
    }, []);

    return (
        <RehabContext.Provider value={{ landmarks, metrics, setPoseData, registerCaptureFn, captureSnapshot }}>
            {children}
        </RehabContext.Provider>
    );
}

export function useRehab() {
    const context = useContext(RehabContext);
    if (context === undefined) {
        throw new Error("useRehab must be used within a RehabProvider");
    }
    return context;
}

