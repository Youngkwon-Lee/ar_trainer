"use client";

import { createContext, useContext, useState, useRef, ReactNode, useCallback } from "react";

// Simplified Landmark Type (based on MediaPipe)
export interface Landmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
}

// Expert Feature: Session Statistics
export interface SessionStats {
    maxSquatDepth: number;
    minSquatDepth: number; // For "standing" consistency
    totalReps: number;
    startTime: number | null;
    endTime: number | null;
    romHistory: number[]; // Store peak ROMs per rep?? Or just max. Let's keep it simple: just Max.
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
    // Session State
    isSessionActive: boolean;
    sessionStats: SessionStats;
}

interface RehabContextType {
    landmarks: Landmark[] | null;
    metrics: RehabMetrics;
    setPoseData: (landmarks: Landmark[]) => void;
    registerCaptureFn: (fn: () => void) => void;
    captureSnapshot: () => void;
    startSession: () => void;
    calibrate: (type: 'STANDING' | 'SQUAT') => void;
    resetCalibration: () => void;
    calibrationData: { standingDiff: number; squatDiff: number } | null;
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
        countingState: "INIT",
        isSessionActive: false,
        sessionStats: {
            maxSquatDepth: 0,
            minSquatDepth: 0,
            totalReps: 0,
            startTime: null,
            endTime: null,
            romHistory: []
        }
    });

    // State for counting
    const wasSquattingRef = useRef(false);
    const lastUpdateRef = useRef(0);

    // Calibration State
    const [calibrationData, setCalibrationData] = useState<{ standingDiff: number; squatDiff: number } | null>(null);

    // Helper to calculate diff (Moved out or duplicated for access)
    // Actually, let's keep it inside setPoseData where it computes diff. 
    // We need a way to capture the CURRENT diff when calibrate is called.
    const currentDiffRef = useRef<number>(0);

    // Optimize: Wrap in useCallback to prevent consumer re-renders
    const setPoseData = useCallback((newLandmarks: Landmark[]) => {
        // PERF FIX: Do NOT update state with raw landmarks on every frame (60fps). 
        // This causes "Maximum update depth" crashes.
        // Components that need raw landmarks should use a Ref or direct callback.
        // setLandmarks(newLandmarks); 

        const now = Date.now();

        // Calculate diff always for calibration reference
        if (newLandmarks.length > 28) {
            const hipY = (newLandmarks[23].y + newLandmarks[24].y) / 2;
            const kneeY = (newLandmarks[25].y + newLandmarks[26].y) / 2;
            currentDiffRef.current = kneeY - hipY;
        }

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

            // DYNAMIC THRESHOLD LOGIC
            let squatDepth = 0;
            if (calibrationData) {
                // Map current diff between standing (0%) and squat (100%)
                const range = calibrationData.squatDiff - calibrationData.standingDiff;
                // Avoid divide by zero
                if (Math.abs(range) > 0.05) {
                    squatDepth = ((diff - calibrationData.standingDiff) / range) * 100;
                }
            } else {
                // Fallback to default
                squatDepth = (0.3 - diff) * (100 / 0.3);
            }
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
                countingState: currentCountingState,
                isSessionActive: prev.isSessionActive,
                sessionStats: {
                    ...prev.sessionStats,
                    maxSquatDepth: prev.isSessionActive ? Math.max(prev.sessionStats.maxSquatDepth, squatDepth) : prev.sessionStats.maxSquatDepth,
                    totalReps: prev.isSessionActive ? prev.reps + increment : prev.reps
                }
            }));
        }
    }, [calibrationData]); // Re-create if calibration changes

    const registerCaptureFn = useCallback((fn: () => void) => {
        captureFnRef.current = fn;
    }, []);

    const captureSnapshot = useCallback(() => {
        if (captureFnRef.current) captureFnRef.current();
    }, []);

    const startSession = useCallback(() => {
        setMetrics(prev => ({
            ...prev,
            reps: 0, // Reset Reps
            isSessionActive: true,
            sessionStats: {
                maxSquatDepth: 0,
                minSquatDepth: 100, // Start high
                totalReps: 0,
                startTime: Date.now(),
                endTime: null,
                romHistory: []
            }
        }));
    }, []);

    const endSession = useCallback(() => {
        setMetrics(prev => ({
            ...prev,
            isSessionActive: false,
            sessionStats: {
                ...prev.sessionStats,
                endTime: Date.now(),
                totalReps: prev.reps // Save final reps
            }
        }));
    }, []);

    // Calibration Function
    const calibrate = useCallback((type: 'STANDING' | 'SQUAT') => {
        const currentVal = currentDiffRef.current;
        console.log(`Calibrating ${type}: ${currentVal}`);
        setCalibrationData(prev => {
            if (type === 'STANDING') {
                return { standingDiff: currentVal, squatDiff: prev ? prev.squatDiff : currentVal - 0.2 }; // Default range if no squat yet
            } else {
                return { standingDiff: prev ? prev.standingDiff : currentVal + 0.2, squatDiff: currentVal };
            }
        });
    }, []);

    const resetCalibration = useCallback(() => {
        setCalibrationData(null);
    }, []);

    return (
        <RehabContext.Provider value={{ landmarks, metrics, setPoseData, registerCaptureFn, captureSnapshot, startSession, endSession, calibrate, resetCalibration, calibrationData }}>
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

