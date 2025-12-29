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
    lastRepQuality: "GOOD" | "BAD" | null;
    currentRepErrors: string[];
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
        rawDiff: 0,
        countingState: "INIT",
        lastRepQuality: null,
        currentRepErrors: [],
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

            // --- 3. View Detection (Advanced 3D) ---
            // Use Z-axis differences to determine Body Yaw (Rotation)
            const leftShoulder = newLandmarks[11];
            const rightShoulder = newLandmarks[12];
            const leftHip = newLandmarks[23];
            const rightHip = newLandmarks[24];

            // Average X, Z differences between Left/Right sides
            const shoulderDx = Math.abs(leftShoulder.x - rightShoulder.x);
            const shoulderDz = Math.abs(leftShoulder.z - rightShoulder.z);
            const hipDx = Math.abs(leftHip.x - rightHip.x);
            const hipDz = Math.abs(leftHip.z - rightHip.z);

            // Estimate Rotation Angle (Yaw) in degrees (0 = Front, 90 = Side)
            // Using atan2 rough approximation given x, z are approx same scale in MediaPipe Normalized Landmarks
            const shoulderYaw = Math.atan2(shoulderDz, shoulderDx) * (180 / Math.PI);
            const hipYaw = Math.atan2(hipDz, hipDx) * (180 / Math.PI);

            // Average Yaw
            const bodyYaw = (shoulderYaw + hipYaw) / 2;

            // Define "Safe Zones" for measurement to avoid Perspective Error
            const isSafeFront = bodyYaw < 30; // 0-30 deg: Reliable for Width/Valgus checks
            const isSafeSide = bodyYaw > 60;  // 60-90 deg: Reliable for Flexion/Lean checks
            const isOblique = !isSafeFront && !isSafeSide; // 30-60 deg: DANGER ZONE (Perspective Distortion High)

            // DEBUG: Log Yaw
            // if (now - lastUpdateRef.current > 500) console.log(`Yaw: ${bodyYaw.toFixed(0)}° (${isSafeFront ? "FRONT" : isSafeSide ? "SIDE" : "OBLIQUE"})`);

            // --- 4. Advanced Feedback with RELIABILITY GATING ---
            const feedbackMessages: string[] = [];

            // Only provide feedback if we are in a reliable view for that metric!

            // A. Knee Valgus (Requires FRONT View)
            // If we check this from the side, a regular squat looks like knees touching.
            if (isSquattingCurrent && isSafeFront) {
                const kneeDist = Math.abs(newLandmarks[25].x - newLandmarks[26].x);
                const ankleDist = Math.abs(newLandmarks[27].x - newLandmarks[28].x);
                // Stricter threshold since we are confident it's front view
                if ((kneeDist / ankleDist) < 0.65) feedbackMessages.push("KNEES INWARD");
            }

            // B. Trunk Lean (Preferred SIDE View, but accept Front if detectable)
            if (isSquattingCurrent) {
                // Calculation: Angle of Trunk Vector vs Vertical
                const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
                const midShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
                const midHipX = (leftHip.x + rightHip.x) / 2;
                const midHipY = (leftHip.y + rightHip.y) / 2;

                const dx = midShoulderX - midHipX;
                const dy = midShoulderY - midHipY; // dy is negative (shoulders above hips)

                // Angle relative to vertical (0 = Upright)
                const trunkAngle = Math.abs(Math.atan2(dx, -dy) * (180 / Math.PI));

                if (isSafeSide) {
                    // From Side: We can see leaning very clearly. 
                    // Threshold: > 35 degrees is usually bad form
                    if (trunkAngle > 35) feedbackMessages.push("CHEST FORWARD");
                }
                else if (isSafeFront) {
                    // From Front: Leaning forward looks like "Shoulders dropping low" or "Short torso".
                    // Foreshortening makes angles unstable. 
                    // Only trigger if EXTREME lean is detected (to maximize Precision, minimize False Positives)
                    // Or... maybe just DISABLE it for Front view to be safe?
                    // Let's rely on a heuristic: If Torso Height (y-diff) shrinks too much relative to leg length?
                    // For now, let's keep it disabled or very loose to avoid "Perspective Error" complaints.
                    if (trunkAngle > 60) feedbackMessages.push("CHEST FORWARD"); // Very loose
                }
            }

            // Warn if in "DANGER ZONE" (Oblique Angle 30-60 deg) where measurements are trash?
            // Optional: feedbackMessages.push("ROTATE TO FRONT OR SIDE"); 
            // But this might be annoying. Let's purely "Gate" (Silence) bad metrics instead.

            // LOGIC: Update State Machine & Refs BEFORE setMetrics
            // Adjusted Thresholds: Stand < 65 (User avg ~53)
            let increment = 0;
            let currentCountingState = wasSquattingRef.current ? "DOWN" : "UP";
            let lastRepQuality = prev.lastRepQuality; // Persist previous quality
            const newFeedback = [...feedbackMessages]; // Current frame feedback

            if (!wasSquattingRef.current && squatDepth > 65) {
                // START SQUAT (DOWN)
                wasSquattingRef.current = true;
                currentCountingState = "DOWN";
                // Reset error tracking for this new rep
                prev.currentRepErrors = [];
            } else if (wasSquattingRef.current && squatDepth < 65) {
                // FINISH SQUAT (UP) -> Count Rep
                wasSquattingRef.current = false;
                currentCountingState = "UP";
                increment = 1;

                // Determine Quality
                const hadErrors = prev.currentRepErrors.length > 0;
                lastRepQuality = hadErrors ? "BAD" : "GOOD";

                // Show Result Feedback (Temporary Override)
                if (!hadErrors) {
                    newFeedback.push("PERFECT FORM! ⭐");
                } else {
                    newFeedback.push("WATCH FORM ⚠️");
                }
            }

            // Accomulate Errors during DOWN state
            if (wasSquattingRef.current) {
                feedbackMessages.forEach(msg => {
                    if (!prev.currentRepErrors.includes(msg)) prev.currentRepErrors.push(msg);
                });
            }

            // SINGLE State Update
            setMetrics(prev => ({
                kneeFlexionLeft: leftKneeAngle,
                kneeFlexionRight: rightKneeAngle,
                squatDepth,
                isGoodForm: feedbackMessages.length === 0,
                actionLabel,
                reps: prev.reps + increment,
                feedback: newFeedback,
                rawDiff: diff,
                countingState: currentCountingState,
                isSessionActive: prev.isSessionActive,
                lastRepQuality: lastRepQuality, // Expose quality
                currentRepErrors: prev.currentRepErrors, // Persist errors for this rep
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

