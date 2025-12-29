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
    maxSquatDepth: number; // Keep for Squat (or generalize to "MaxRange")
    minSquatDepth: number;
    totalReps: number;
    startTime: number | null;
    endTime: number | null;
    romHistory: number[];
}

export interface RehabMetrics {
    // Squat Metrics
    kneeFlexionLeft: number;
    kneeFlexionRight: number;
    squatDepth: number;

    // Bench Metrics
    elbowExtensionLeft: number;
    elbowExtensionRight: number;

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

export type ExerciseType = 'SQUAT' | 'BENCH' | 'DEADLIFT';

interface RehabContextType {
    landmarks: Landmark[] | null;
    metrics: RehabMetrics;
    exerciseType: ExerciseType; // New
    setPoseData: (landmarks: Landmark[]) => void;
    registerCaptureFn: (fn: () => void) => void;
    captureSnapshot: () => void;
    startSession: () => void;
    endSession: () => void; // Added missing method
    calibrate: (type: 'STANDING' | 'SQUAT') => void; // Keep simpler for now
    resetCalibration: () => void;
    calibrationData: { standingDiff: number; squatDiff: number } | null;
}

const RehabContext = createContext<RehabContextType | undefined>(undefined);

const calculateAngle = (a: Landmark, b: Landmark, c: Landmark) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
};

export function RehabProvider({ children, exercise = 'SQUAT' }: { children: ReactNode, exercise?: ExerciseType }) {
    const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
    const [exerciseType] = useState<ExerciseType>(exercise); // Fixed per provider instance
    const captureFnRef = useRef<(() => void) | null>(null);

    const [metrics, setMetrics] = useState<RehabMetrics>({
        kneeFlexionLeft: 180,
        kneeFlexionRight: 180,
        squatDepth: 0,
        elbowExtensionLeft: 180, // New
        elbowExtensionRight: 180, // New
        isGoodForm: true,
        actionLabel: "INIT",
        reps: 0,
        feedback: [],
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

    const wasSquattingRef = useRef(false); // Used for Squat logic
    const wasBenchPressingRef = useRef(false); // Used for Bench logic (Arms extended vs flexed)
    const lastUpdateRef = useRef(0);
    const [calibrationData, setCalibrationData] = useState<{ standingDiff: number; squatDiff: number } | null>(null);
    const currentDiffRef = useRef<number>(0);

    const setPoseData = useCallback((newLandmarks: Landmark[]) => {
        const now = Date.now();

        // Calibration Hook (Squat Only for now)
        if (exerciseType === 'SQUAT' && newLandmarks.length > 28) {
            const hipY = (newLandmarks[23].y + newLandmarks[24].y) / 2;
            const kneeY = (newLandmarks[25].y + newLandmarks[26].y) / 2;
            currentDiffRef.current = kneeY - hipY;
        }

        if (now - lastUpdateRef.current < 100) return;
        lastUpdateRef.current = now;

        if (newLandmarks.length > 28) {

            // --- SQUAT LOGIC ---
            if (exerciseType === 'SQUAT') {
                const leftKneeAngle = calculateAngle(newLandmarks[23], newLandmarks[25], newLandmarks[27]);
                const rightKneeAngle = calculateAngle(newLandmarks[24], newLandmarks[26], newLandmarks[28]);

                const hipY = (newLandmarks[23].y + newLandmarks[24].y) / 2;
                const kneeY = (newLandmarks[25].y + newLandmarks[26].y) / 2;
                const diff = kneeY - hipY;

                let squatDepth = 0;
                if (calibrationData) {
                    const range = calibrationData.squatDiff - calibrationData.standingDiff;
                    if (Math.abs(range) > 0.05) {
                        squatDepth = ((diff - calibrationData.standingDiff) / range) * 100;
                    }
                } else {
                    squatDepth = (0.3 - diff) * (100 / 0.3);
                }
                squatDepth = Math.max(0, Math.min(100, squatDepth));

                const isSquattingCurrent = squatDepth > 50;
                const actionLabel = isSquattingCurrent ? "SQUAT" : "STANDING";

                // View Detection (Reuse existing)
                const shoulderWidth = Math.abs(newLandmarks[11].x - newLandmarks[12].x);
                const torsoHeight = Math.abs(newLandmarks[11].y - newLandmarks[23].y);
                const viewRatio = shoulderWidth / (torsoHeight || 1);
                const isFrontView = viewRatio > 0.35; // Basic 2D fallback

                const feedbackMessages: string[] = [];
                if (isSquattingCurrent && isFrontView) {
                    const kneeDist = Math.abs(newLandmarks[25].x - newLandmarks[26].x);
                    const ankleDist = Math.abs(newLandmarks[27].x - newLandmarks[28].x);
                    if ((kneeDist / ankleDist) < 0.65) feedbackMessages.push("KNEES INWARD");
                }
                if (isSquattingCurrent && !isFrontView) {
                    // Simple lean check since 3D code was reverted to keep it simple for this file update
                    // or assume 3D block existed? 
                    // Let's implement the 2D version for safety in this large context switch
                    const shoulderX = (newLandmarks[11].x + newLandmarks[12].x) / 2;
                    const hipX = (newLandmarks[23].x + newLandmarks[24].x) / 2;
                    if (Math.abs(shoulderX - hipX) > 0.2) feedbackMessages.push("CHEST FORWARD");
                }

                setMetrics(prev => {
                    let increment = 0;
                    let currentCountingState = prev.countingState;
                    let lastRepQuality = prev.lastRepQuality;
                    let currentRepErrors = [...prev.currentRepErrors];
                    const newFeedback = [...feedbackMessages];

                    const wasDown = prev.countingState === "DOWN";
                    const isSquatDeep = squatDepth > 65;
                    const isStandTall = squatDepth < 65;

                    if (!wasDown && isSquatDeep) {
                        currentCountingState = "DOWN";
                        currentRepErrors = [];
                        wasSquattingRef.current = true;
                    } else if (wasDown && isStandTall) {
                        currentCountingState = "UP";
                        increment = 1;
                        wasSquattingRef.current = false;
                        const hadErrors = currentRepErrors.length > 0;
                        lastRepQuality = hadErrors ? "BAD" : "GOOD";
                        if (!hadErrors) newFeedback.push("PERFECT FORM! ⭐");
                        else newFeedback.push("WATCH FORM ⚠️");
                    }

                    if (currentCountingState === "DOWN") {
                        feedbackMessages.forEach(msg => {
                            if (!currentRepErrors.includes(msg)) currentRepErrors.push(msg);
                        });
                    }

                    return {
                        ...prev, // Keep other generic metrics
                        kneeFlexionLeft: leftKneeAngle,
                        kneeFlexionRight: rightKneeAngle,
                        squatDepth,
                        elbowExtensionLeft: 180, // Reset/default for squat
                        elbowExtensionRight: 180, // Reset/default for squat
                        trunkAngle: 180, // Reset/default for squat
                        hipHingeDepth: 0, // Reset/default for squat
                        barbellPath: 0, // Reset/default for squat
                        isGoodForm: feedbackMessages.length === 0,
                        actionLabel,
                        reps: prev.reps + increment,
                        feedback: newFeedback,
                        rawDiff: diff, // Squat specific
                        countingState: currentCountingState,
                        lastRepQuality,
                        currentRepErrors,
                        sessionStats: {
                            ...prev.sessionStats,
                            maxSquatDepth: prev.isSessionActive ? Math.max(prev.sessionStats.maxSquatDepth, squatDepth) : prev.sessionStats.maxSquatDepth,
                            totalReps: prev.isSessionActive ? prev.reps + increment : prev.reps
                        }
                    };
                });
            }

            // --- BENCH PRESS LOGIC ---
            else if (exerciseType === 'BENCH') {
                // Tracking Elbow Extension (180 = Straight, 90 or less = Bent)
                // Landmarks: Shoulder(11/12), Elbow(13/14), Wrist(15/16)
                const leftElbowAngle = calculateAngle(newLandmarks[11], newLandmarks[13], newLandmarks[15]);
                const rightElbowAngle = calculateAngle(newLandmarks[12], newLandmarks[14], newLandmarks[16]);
                const avgExtension = (leftElbowAngle + rightElbowAngle) / 2;

                const feedbackMessages: string[] = [];

                // 1. Elbow Flare Check (Armpit Angle)
                // Angle between Torso Vertical and Upper Arm
                // Should keep elbows somewhat tucked (< 75 deg relative to torso is safer)
                // Calculate torso vector
                // This is hard in 2D top-down, but let's try Shoulder-Elbow distance vs Shoulder-Hip
                // Simple heuristic: If Elbow Y is very close to Shoulder Y (T-pose), it's flaring.
                // Assuming "Head at Top" view.
                const shouldY = (newLandmarks[11].y + newLandmarks[12].y) / 2;
                const elbowY = (newLandmarks[13].y + newLandmarks[14].y) / 2;
                const elbowFlareMetric = Math.abs(elbowY - shouldY);
                // If small vertical difference, arms are T-posed (Bad). If large, arms are tucked (Good).
                if (elbowFlareMetric < 0.1 && avgExtension < 120) feedbackMessages.push("TUCK ELBOWS ⚠️");

                // 2. Imbalance Check
                if (Math.abs(leftElbowAngle - rightElbowAngle) > 15) feedbackMessages.push("UNEVEN PUSH ⚖️");

                setMetrics(prev => {
                    let increment = 0;
                    let currentCountingState = prev.countingState; // "UP" (Extended) or "DOWN" (Chest Level)
                    let lastRepQuality = prev.lastRepQuality;
                    let currentRepErrors = [...prev.currentRepErrors];
                    const newFeedback = [...feedbackMessages];

                    // Logic: Start Extended (> 160) -> Go Down (< 100) -> Go Up (> 160)
                    // Note: Bench starts UP. "DOWN" phase is the eccentric.
                    const isExtended = avgExtension > 160;
                    const isFlexed = avgExtension < 100;

                    if (currentCountingState === "INIT" && isExtended) currentCountingState = "UP";

                    // Rep Cycle: UP -> DOWN -> UP
                    // State "UP": Waiting for descent.
                    // State "DOWN": Waiting for ascent.

                    if (currentCountingState === "UP" && isFlexed) {
                        currentCountingState = "DOWN"; // Started rep
                        currentRepErrors = []; // Reset quality
                    }
                    else if (currentCountingState === "DOWN" && isExtended) {
                        currentCountingState = "UP"; // Finished rep
                        increment = 1;

                        const hadErrors = currentRepErrors.length > 0;
                        lastRepQuality = hadErrors ? "BAD" : "GOOD";
                        if (!hadErrors) newFeedback.push("SOLID PRESS! 💪");
                        else newFeedback.push("FIX FORM ⚠️");
                    }

                    // Accumulate errors during movement
                    if (currentCountingState === "DOWN" || currentCountingState === "UP") {
                        feedbackMessages.forEach(msg => {
                            if (!currentRepErrors.includes(msg)) currentRepErrors.push(msg);
                        });
                    }

                    return {
                        ...prev,
                        kneeFlexionLeft: 0, // Ignored for bench
                        kneeFlexionRight: 0, // Ignored for bench
                        squatDepth: 0, // Ignored for bench
                        elbowExtensionLeft: leftElbowAngle,
                        elbowExtensionRight: rightElbowAngle,
                        isGoodForm: feedbackMessages.length === 0,
                        actionLabel: currentCountingState === "DOWN" ? "PUSHING" : "LOCKED OUT",
                        reps: prev.reps + increment,
                        feedback: newFeedback,
                        rawDiff: 0, // Bench specific, or calculate a relevant diff
                        countingState: currentCountingState,
                        lastRepQuality,
                        currentRepErrors,
                        sessionStats: {
                            ...prev.sessionStats,
                            totalReps: prev.isSessionActive ? prev.reps + increment : prev.reps
                        }
                    };
                });
            }
        }
    }, [calibrationData, exerciseType]);

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
        <RehabContext.Provider value={{ landmarks, metrics, exerciseType, setPoseData, registerCaptureFn, captureSnapshot, startSession, endSession, calibrate, resetCalibration, calibrationData }}>
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

