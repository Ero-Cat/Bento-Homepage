"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LIQUID_GLASS_CANVAS } from "@/lib/liquid-glass";



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
    const previousUrlRef = useRef("");

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
    const nextImage =
        shuffled.length > 1 ? shuffled[(index + 1) % shuffled.length] : currentImage;

    useEffect(() => {
        const root = document.documentElement;
        const activeUrl = currentImage ? `/bg/${currentImage}` : "";
        const nextUrl = nextImage ? `/bg/${nextImage}` : "";
        const previousUrl = previousUrlRef.current;
        let cleanupTimer: number | undefined;

        if (activeUrl) {
            root.dataset[LIQUID_GLASS_CANVAS.activeBackgroundDatasetKey] = activeUrl;
        } else {
            delete root.dataset[LIQUID_GLASS_CANVAS.activeBackgroundDatasetKey];
        }

        if (nextUrl) {
            root.dataset[LIQUID_GLASS_CANVAS.nextBackgroundDatasetKey] = nextUrl;
        } else {
            delete root.dataset[LIQUID_GLASS_CANVAS.nextBackgroundDatasetKey];
        }

        if (previousUrl && previousUrl !== activeUrl) {
            root.dataset[LIQUID_GLASS_CANVAS.previousBackgroundDatasetKey] = previousUrl;
            root.dataset[LIQUID_GLASS_CANVAS.backgroundTransitionDurationDatasetKey] =
                `${LIQUID_GLASS_CANVAS.backgroundTransitionMs}`;

            cleanupTimer = window.setTimeout(() => {
                if (root.dataset[LIQUID_GLASS_CANVAS.activeBackgroundDatasetKey] === activeUrl) {
                    delete root.dataset[LIQUID_GLASS_CANVAS.previousBackgroundDatasetKey];
                    delete root.dataset[LIQUID_GLASS_CANVAS.backgroundTransitionDurationDatasetKey];
                }
            }, LIQUID_GLASS_CANVAS.backgroundTransitionMs);
        } else {
            delete root.dataset[LIQUID_GLASS_CANVAS.previousBackgroundDatasetKey];
            delete root.dataset[LIQUID_GLASS_CANVAS.backgroundTransitionDurationDatasetKey];
        }

        previousUrlRef.current = activeUrl;

        return () => {
            if (cleanupTimer) {
                window.clearTimeout(cleanupTimer);
            }
        };
    }, [currentImage, nextImage]);

    useEffect(() => {
        const root = document.documentElement;
        return () => {
            delete root.dataset[LIQUID_GLASS_CANVAS.activeBackgroundDatasetKey];
            delete root.dataset[LIQUID_GLASS_CANVAS.nextBackgroundDatasetKey];
            delete root.dataset[LIQUID_GLASS_CANVAS.previousBackgroundDatasetKey];
            delete root.dataset[LIQUID_GLASS_CANVAS.backgroundTransitionDurationDatasetKey];
        };
    }, []);

    return (
        <div className="fixed inset-0 z-0" aria-hidden="true">
            {/* Crossfade background images */}
            <AnimatePresence initial={false} mode="sync">
                <motion.div
                    key={currentImage}
                    className="absolute inset-0"
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
                        var(--bg-overlay) 46%,
                        var(--bg-overlay) 58%,
                        var(--bg-overlay-gradient-bottom) 100%
                    )`,
                }}
            />
        </div>
    );
}
