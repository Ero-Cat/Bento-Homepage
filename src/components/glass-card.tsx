"use client";

import React, { useRef, useCallback } from "react";
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    type MotionValue,
} from "framer-motion";
import { cn } from "@/lib/utils";

/* ============================================================
   Tilt Config — Mimics vanilla-tilt.js behavior
   ============================================================ */
const TILT_CONFIG = {
    /** Max rotation in degrees */
    maxRotation: 15,
    /** Perspective in px — higher = subtler 3D */
    perspective: 1000,
    /** Spring tuning — critically damped to avoid oscillation */
    tiltSpring: { stiffness: 100, damping: 30, mass: 0.4 },
};

/* ============================================================
   Glare Overlay — Mouse-following specular highlight
   ============================================================
   Performance notes:
   - Uses a single useTransform to build the full style object
     instead of 3 separate ones (saves 2 subscriptions per frame)
   - Returns a complete style to avoid per-frame string rebuilds
   ============================================================ */
function GlareOverlay({
    mouseX,
    mouseY,
}: {
    mouseX: MotionValue<number>;
    mouseY: MotionValue<number>;
}) {
    /* Combine all glare computations into one transform → 1 subscription instead of 3 */
    const glareStyle = useTransform<number, string>(
        [mouseX, mouseY],
        ([lx, ly]: number[]) => {
            const gx = (lx + 0.5) * 100;
            const gy = (ly + 0.5) * 100;
            const dist = Math.sqrt(lx * lx + ly * ly);
            const op = Math.min(dist * 0.5, 0.3);
            return `${gx}|${gy}|${op}`;
        }
    );

    const background = useTransform(glareStyle, (v: string) => {
        const [gx, gy] = v.split("|");
        return `radial-gradient(700px circle at ${gx}% ${gy}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.08) 40%, transparent 65%)`;
    });

    const opacity = useTransform(glareStyle, (v: string) => {
        return parseFloat(v.split("|")[2]);
    });

    return (
        <motion.div
            className="pointer-events-none absolute inset-0 z-30 rounded-[inherit]"
            style={{ background, opacity, mixBlendMode: "overlay" }}
        />
    );
}

/* ============================================================
   Composited Transform — Inline perspective for correct vanishing point
   ============================================================ */
function useCompositedTransform(
    rotX: MotionValue<number>,
    rotY: MotionValue<number>,
    perspective: number
) {
    return useTransform<number, string>(
        [rotX, rotY],
        ([rx, ry]: number[]) =>
            `perspective(${perspective}px) rotateX(${rx}deg) rotateY(${ry}deg)`
    );
}

/* ============================================================
   GlassCard Component
   ============================================================
   Performance changes vs. original:
   1. Removed useDynamicShadow — per-frame string concat for
      box-shadow is expensive and visually subtle. Using static
      CSS shadow from .glass-card instead.
   2. Consolidated GlareOverlay into 1 useTransform chain
      (was 3 separate: glareX/Y, opacity, background).
   3. Removed willChange:"transform" — it pre-promotes to a
      compositing layer which is counterproductive with
      backdrop-filter children (forces re-composite every frame).
   ============================================================ */
interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    href?: string;
    noTilt?: boolean;
}

export function GlassCard({
    children,
    className,
    href,
    noTilt = false,
}: GlassCardProps) {
    const ref = useRef<HTMLElement>(null);

    /* ---- Motion values: raw mouse position → [-0.5, 0.5] ---- */
    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);

    /* ---- Smooth spring → no oscillation ---- */
    const springX = useSpring(rawX, TILT_CONFIG.tiltSpring);
    const springY = useSpring(rawY, TILT_CONFIG.tiltSpring);

    /* ---- Map to rotation ---- */
    const max = TILT_CONFIG.maxRotation;
    const rotateX = useTransform(springY, [-0.5, 0.5], [max, -max]);
    const rotateY = useTransform(springX, [-0.5, 0.5], [-max, max]);

    /* ---- Composited transform with inline perspective ---- */
    const transform = useCompositedTransform(
        rotateX,
        rotateY,
        TILT_CONFIG.perspective
    );

    /* ---- Event handlers ---- */
    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLElement>) => {
            if (noTilt || !ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            rawX.set((e.clientX - rect.left) / rect.width - 0.5);
            rawY.set((e.clientY - rect.top) / rect.height - 0.5);
        },
        [noTilt, rawX, rawY]
    );

    const handleMouseLeave = useCallback(() => {
        rawX.set(0);
        rawY.set(0);
    }, [rawX, rawY]);

    /* ---- Styles ---- */
    const motionStyle = noTilt
        ? undefined
        : {
            transform,
            transformStyle: "preserve-3d" as const,
        };

    const cardClass = cn(
        "glass-card p-6 relative z-10 h-full",
        className
    );

    if (href) {
        return (
            <motion.a
                ref={ref as any}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(cardClass, "block")}
                style={motionStyle}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {!noTilt && <GlareOverlay mouseX={rawX} mouseY={rawY} />}
                {children}
            </motion.a>
        );
    }

    return (
        <motion.div
            ref={ref as any}
            className={cardClass}
            style={motionStyle}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {!noTilt && <GlareOverlay mouseX={rawX} mouseY={rawY} />}
            {children}
        </motion.div>
    );
}
