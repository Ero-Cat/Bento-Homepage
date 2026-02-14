"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";



/** Shuffle array using Fisher-Yates */
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const INTERVAL_MS = 10_000; // 10 seconds per image

interface BackgroundLayerProps {
    images: string[];
}

export function BackgroundLayer({ images }: BackgroundLayerProps) {
    const [shuffled, setShuffled] = useState<string[]>([]);
    const [index, setIndex] = useState(0);

    // Shuffle on mount (client only) to avoid hydration mismatch
    useEffect(() => {
        setShuffled(shuffle(images));
    }, [images]);

    // Auto-advance
    const advance = useCallback(() => {
        setIndex((prev) => (prev + 1) % shuffled.length);
    }, [shuffled.length]);

    useEffect(() => {
        if (shuffled.length <= 1) return;
        const timer = setInterval(advance, INTERVAL_MS);
        return () => clearInterval(timer);
    }, [advance, shuffled.length]);

    // Preload next image
    useEffect(() => {
        if (shuffled.length <= 1) return;
        const nextIdx = (index + 1) % shuffled.length;
        const img = new Image();
        img.src = `/bg/${shuffled[nextIdx]}`;
    }, [index, shuffled]);

    const currentImage = shuffled.length > 0 ? shuffled[index] : images[0];

    return (
        <div className="fixed inset-0 z-0" aria-hidden="true">
            {/* Crossfade background images */}
            <AnimatePresence mode="sync">
                <motion.div
                    key={currentImage}
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    style={{
                        backgroundImage: `url('/bg/${currentImage}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                    }}
                />
            </AnimatePresence>

            {/* Gradient overlay — adapts to light/dark via CSS vars */}
            <div
                className="absolute inset-0"
                style={{
                    background: `linear-gradient(
                        to bottom,
                        var(--bg-overlay-gradient-top) 0%,
                        var(--bg-overlay) 40%,
                        var(--bg-overlay) 60%,
                        var(--bg-overlay-gradient-bottom) 100%
                    )`,
                }}
            />

            {/* Floating color orbs — "Crystal Clarity" Edition */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Orb 1 — Jewel Rose/Tint */}
                <div
                    className="absolute w-[700px] h-[700px] rounded-full opacity-20"
                    style={{
                        top: "-10%",
                        left: "-5%",
                        background: "radial-gradient(circle, rgba(var(--tint-rgb), 0.25) 0%, transparent 70%)",
                        animation: "float-orb-1 25s ease-in-out infinite",
                        filter: "blur(120px)",
                    }}
                />
                {/* Orb 2 — Cool Blue/Slate */}
                <div
                    className="absolute w-[600px] h-[600px] rounded-full opacity-15"
                    style={{
                        bottom: "-5%",
                        right: "-5%",
                        background: "radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)",
                        animation: "float-orb-2 30s ease-in-out infinite",
                        filter: "blur(120px)",
                    }}
                />
                {/* Orb 3 — Warm Platinum/Gold */}
                <div
                    className="absolute w-[500px] h-[500px] rounded-full opacity-10"
                    style={{
                        top: "40%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "radial-gradient(circle, rgba(200, 200, 220, 0.2) 0%, transparent 70%)",
                        animation: "float-orb-3 22s ease-in-out infinite",
                        filter: "blur(100px)",
                    }}
                />
            </div>

            {/* Noise grain texture */}
            <div
                className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "repeat",
                }}
            />
        </div>
    );
}
