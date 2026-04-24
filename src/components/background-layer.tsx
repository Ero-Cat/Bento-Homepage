"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
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
const IMAGE_EXT_RE = /\.(jpe?g|png|webp|avif)$/i;

function optimizedBgUrl(filename: string) {
    return `/optimized/bg/${filename.replace(IMAGE_EXT_RE, ".webp")}`;
}

interface BackgroundLayerProps {
    images: string[];
}

export function BackgroundLayer({ images }: BackgroundLayerProps) {
    const [shuffled, setShuffled] = useState<string[]>([]);
    const [index, setIndex] = useState(0);
    const previousUrlRef = useRef("");
    const previousImageRef = useRef("");
    const [fadingImage, setFadingImage] = useState("");

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
        const img = new window.Image();
        img.src = optimizedBgUrl(shuffled[nextIdx]);
    }, [index, shuffled]);

    const currentImage = shuffled.length > 0 ? shuffled[index] : images[0];
    const nextImage =
        shuffled.length > 1 ? shuffled[(index + 1) % shuffled.length] : currentImage;

    useEffect(() => {
        const root = document.documentElement;
        const activeUrl = currentImage ? optimizedBgUrl(currentImage) : "";
        const nextUrl = nextImage ? optimizedBgUrl(nextImage) : "";
        const previousUrl = previousUrlRef.current;
        const previousImage = previousImageRef.current;
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
            if (previousImage) {
                setFadingImage(previousImage);
            }
            root.dataset[LIQUID_GLASS_CANVAS.previousBackgroundDatasetKey] = previousUrl;
            root.dataset[LIQUID_GLASS_CANVAS.backgroundTransitionDurationDatasetKey] =
                `${LIQUID_GLASS_CANVAS.backgroundTransitionMs}`;

            cleanupTimer = window.setTimeout(() => {
                if (root.dataset[LIQUID_GLASS_CANVAS.activeBackgroundDatasetKey] === activeUrl) {
                    delete root.dataset[LIQUID_GLASS_CANVAS.previousBackgroundDatasetKey];
                    delete root.dataset[LIQUID_GLASS_CANVAS.backgroundTransitionDurationDatasetKey];
                }
                setFadingImage((image) => (image === previousImage ? "" : image));
            }, LIQUID_GLASS_CANVAS.backgroundTransitionMs);
        } else {
            setFadingImage("");
            delete root.dataset[LIQUID_GLASS_CANVAS.previousBackgroundDatasetKey];
            delete root.dataset[LIQUID_GLASS_CANVAS.backgroundTransitionDurationDatasetKey];
        }

        previousUrlRef.current = activeUrl;
        previousImageRef.current = currentImage;

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
            {fadingImage && (
                <Image
                    key={`prev-${fadingImage}`}
                    src={optimizedBgUrl(fadingImage)}
                    alt=""
                    fill
                    sizes="100vw"
                    className="bg-image-layer bg-image-layer--previous"
                    aria-hidden="true"
                />
            )}
            {currentImage && (
                <Image
                    key={`current-${currentImage}`}
                    src={optimizedBgUrl(currentImage)}
                    alt=""
                    fill
                    sizes="100vw"
                    priority
                    className="bg-image-layer bg-image-layer--current"
                    aria-hidden="true"
                />
            )}

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
