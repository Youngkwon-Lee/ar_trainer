"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface HUDContainerProps {
    children: ReactNode;
}

export const HUDContainer = ({ children }: HUDContainerProps) => {
    return (
        <div className="relative h-screen w-full overflow-hidden text-cyan-50 font-sans selection:bg-cyan-500/30">
            {/* Top Bar with System Info */}
            <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-mono uppercase tracking-widest text-red-500">REC 00:04:23</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-cyan-400">
                    <span>BAT 84%</span>
                    <span>WIFI ON</span>
                    <span>Rx: REHAB_01</span>
                </div>
            </header>

            {/* Corner Accents - Top Left */}
            <svg className="absolute top-8 left-8 w-16 h-16 pointer-events-none z-40 opacity-80" viewBox="0 0 100 100">
                <path d="M 2 2 L 30 2 L 2 30 Z" fill="cyan" className="opacity-60" />
                <path d="M 0 0 L 100 0 L 100 4 L 4 4 L 4 100 L 0 100 Z" fill="cyan" />
            </svg>

            {/* Corner Accents - Top Right */}
            <svg className="absolute top-8 right-8 w-16 h-16 pointer-events-none z-40 opacity-80 rotate-90" viewBox="0 0 100 100">
                <path d="M 0 0 L 100 0 L 100 4 L 4 4 L 4 100 L 0 100 Z" fill="cyan" />
            </svg>

            {/* Corner Accents - Bottom Left */}
            <svg className="absolute bottom-8 left-8 w-16 h-16 pointer-events-none z-40 opacity-80 -rotate-90" viewBox="0 0 100 100">
                <path d="M 0 0 L 100 0 L 100 4 L 4 4 L 4 100 L 0 100 Z" fill="cyan" />
            </svg>

            {/* Corner Accents - Bottom Right */}
            <svg className="absolute bottom-8 right-8 w-16 h-16 pointer-events-none z-40 opacity-80 rotate-180" viewBox="0 0 100 100">
                <path d="M 0 0 L 100 0 L 100 4 L 4 4 L 4 100 L 0 100 Z" fill="cyan" />
            </svg>

            {/* Main Content Area */}
            <main className="relative z-10 w-full h-full p-4 md:p-12 flex flex-col justify-between">
                {children}
            </main>

            {/* Bottom Bar / Status Line */}
            <footer className="absolute bottom-4 left-0 right-0 z-50 text-center">
                <div className="inline-block px-4 py-1 bg-black/40 backdrop-blur-sm border border-cyan-500/30 rounded-full">
                    <span className="text-[10px] tracking-[0.2em] font-light text-cyan-200 uppercase">System Active • AI Vision Enabled</span>
                </div>
            </footer>
        </div>
    );
};
