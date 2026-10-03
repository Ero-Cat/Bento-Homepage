"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { LIQUID_GLASS_CANVAS } from "@/lib/liquid-glass";
import {
    analyzeImageLuminance,
    classifyBackgroundAppearance,
    getCachedImageLuminance,
    type BackgroundAppearance,
} from "@/lib/palette";



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

interface PendingBackgroundTransition {
    activeUrl: string;
    previousUrl: string;
    previousImage: string;
}

export function BackgroundLayer({ images }: BackgroundLayerProps) {
    const [shuffled, setShuffled] = useState<string[]>([]);
    const [index, setIndex] = useState(0);
    const previousUrlRef = useRef("");
    const previousImageRef = useRef("");
    const pendingTransitionRef = useRef<PendingBackgroundTransition | null>(null);
    const [fadingImage, setFadingImage] = useState("");
    const bgAppearanceRef = useRef<BackgroundAppearance>("auto");

    /* ── Adaptive text appearance ─────────────────────────────
       Rotating backdrops can drift toward the text color; the
       token flip rides the SAME 2s crossfade (CSS transition on
       the registered --text-* properties). Analysis runs ahead of
       time during preload, so classification is a sync lookup at
       the transition moment. */
    const applyBgAppearance = useCallback((url: string) => {
        const luminance = getCachedImageLuminance(url);
        if (luminance === undefined) return;
        const scheme = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
        const next = classifyBackgroundAppearance(luminance, scheme);
        if (next === bgAppearanceRef.current) return;
        bgAppearanceRef.current = next;
        const root = document.documentElement;
        if (next === "auto") {
            delete root.dataset.bgAppearance;
        } else {
            root.dataset.bgAppearance = next;
        }
    }, []);

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

    // Preload next image + pre-compute its tone for the text-appearance flip
    useEffect(() => {
        if (shuffled.length <= 1) return;
        const nextIdx = (index + 1) % shuffled.length;
        const img = new window.Image();
        img.src = optimizedBgUrl(shuffled[nextIdx]);
        void analyzeImageLuminance(optimizedBgUrl(shuffled[nextIdx]));
    }, [index, shuffled]);

    const currentImage = shuffled.length > 0 ? shuffled[index] : images[0];
    const nextImage =
        shuffled.length > 1 ? shuffled[(index + 1) % shuffled.length] : currentImage;

    const startBackgroundTransition = useCallback(() => {
        const transition = pendingTransitionRef.current;
        if (!transition) return;

        const root = document.documentElement;
        root.dataset[LIQUID_GLASS_CANVAS.activeBackgroundDatasetKey] = transition.activeUrl;
        root.dataset[LIQUID_GLASS_CANVAS.previousBackgroundDatasetKey] = transition.previousUrl;
        root.dataset[LIQUID_GLASS_CANVAS.backgroundTransitionStartedAtDatasetKey] =
            `${performance.now()}`;
        root.dataset[LIQUID_GLASS_CANVAS.backgroundTransitionDurationDatasetKey] =
            `${LIQUID_GLASS_CANVAS.backgroundTransitionMs}`;
        applyBgAppearance(transition.activeUrl);
    }, [applyBgAppearance]);

    const finishBackgroundTransition = useCallback(() => {
        const transition = pendingTransitionRef.current;
        if (!transition) return;

        const root = document.documentElement;
        if (root.dataset[LIQUID_GLASS_CANVAS.activeBackgroundDatasetKey] === transition.activeUrl) {
            delete root.dataset[LIQUID_GLASS_CANVAS.previousBackgroundDatasetKey];
            delete root.dataset[LIQUID_GLASS_CANVAS.backgroundTransitionStartedAtDatasetKey];
            delete root.dataset[LIQUID_GLASS_CANVAS.backgroundTransitionDurationDatasetKey];
        }
        setFadingImage((image) => (image === transition.previousImage ? "" : image));
        pendingTransitionRef.current = null;
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        const activeUrl = currentImage ? optimizedBgUrl(currentImage) : "";
        const nextUrl = nextImage ? optimizedBgUrl(nextImage) : "";
        const previousUrl = previousUrlRef.current;
        const previousImage = previousImageRef.current;

        if (nextUrl) {
            root.dataset[LIQUID_GLASS_CANVAS.nextBackgroundDatasetKey] = nextUrl;
        } else {
            delete root.dataset[LIQUID_GLASS_CANVAS.nextBackgroundDatasetKey];
        }

        if (previousUrl && previousUrl !== activeUrl && previousImage) {
            pendingTransitionRef.current = { activeUrl, previousUrl, previousImage };
            setFadingImage(previousImage);
        } else {
            pendingTransitionRef.current = null;
            setFadingImage("");
            if (activeUrl) {
                root.dataset[LIQUID_GLASS_CANVAS.activeBackgroundDatasetKey] = activeUrl;
                applyBgAppearance(activeUrl);
            } else {
                delete root.dataset[LIQUID_GLASS_CANVAS.activeBackgroundDatasetKey];
            }
            delete root.dataset[LIQUID_GLASS_CANVAS.previousBackgroundDatasetKey];
            delete root.dataset[LIQUID_GLASS_CANVAS.backgroundTransitionStartedAtDatasetKey];
            delete root.dataset[LIQUID_GLASS_CANVAS.backgroundTransitionDurationDatasetKey];
        }

        previousUrlRef.current = activeUrl;
        previousImageRef.current = currentImage;
    }, [currentImage, nextImage, applyBgAppearance]);

    // First image is never "next" — analyze it once loaded, then apply
    useEffect(() => {
        if (!currentImage) return;
        const url = optimizedBgUrl(currentImage);
        let cancelled = false;
        void analyzeImageLuminance(url).then(() => {
            if (!cancelled) applyBgAppearance(url);
        });
        return () => {
            cancelled = true;
        };
    }, [currentImage, applyBgAppearance]);

    // Scheme flips re-bias classification of the already-active backdrop
    useEffect(() => {
        if (!currentImage) return;
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const onChange = () => applyBgAppearance(optimizedBgUrl(currentImage));
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, [currentImage, applyBgAppearance]);

    useEffect(() => {
        const root = document.documentElement;
        return () => {
            delete root.dataset[LIQUID_GLASS_CANVAS.activeBackgroundDatasetKey];
            delete root.dataset[LIQUID_GLASS_CANVAS.nextBackgroundDatasetKey];
            delete root.dataset[LIQUID_GLASS_CANVAS.previousBackgroundDatasetKey];
            delete root.dataset[LIQUID_GLASS_CANVAS.backgroundTransitionStartedAtDatasetKey];
            delete root.dataset[LIQUID_GLASS_CANVAS.backgroundTransitionDurationDatasetKey];
            delete root.dataset.bgAppearance;
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
                    onAnimationStart={startBackgroundTransition}
                    onAnimationEnd={finishBackgroundTransition}
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
