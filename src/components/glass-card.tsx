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
   ============================================================
   Key differences from before:
   - perspective is INLINE in transform (not on parent container)
     → ensures the vanishing point is always at the element center
   - High damping + low stiffness → no oscillation, smooth arrival
   - transform-style: preserve-3d on the card itself
   ============================================================ */
const TILT_CONFIG = {
    /** Max rotation in degrees (vanilla-tilt default: 20) */
    maxRotation: 15,
    /** Perspective in px — higher = subtler 3D, lower = more extreme */
    perspective: 1000,
    /**
     * Spring tuning — critically damped to avoid oscillation.
     * vanilla-tilt uses CSS cubic-bezier(.03,.98,.52,.99) @ 400ms.
     * We approximate this with a high-damping spring:
     *  - stiffness 100: moderate pull toward target
     *  - damping 30: strong damping → NO visible oscillation
     *  - mass 0.4: lightweight → fast response
     */
    tiltSpring: { stiffness: 100, damping: 30, mass: 0.4 },
    /**
     * Return spring — even smoother for the "reset" animation.
     * Slightly lower stiffness for a lazy float-back.
     */
    resetSpring: { stiffness: 60, damping: 20, mass: 0.5 },
};

/* ============================================================
   Glare Overlay — Mouse-following specular highlight
   ============================================================ */
function GlareOverlay({
    mouseX,
    mouseY,
}: {
    mouseX: MotionValue<number>;
    mouseY: MotionValue<number>;
}) {
    const glareX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
    const glareY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);

    const opacity = useTransform<number, number>(
        [mouseX, mouseY],
        ([latestX, latestY]: number[]) => {
            const dist = Math.sqrt(latestX * latestX + latestY * latestY);
            return Math.min(dist * 0.5, 0.3);
        }
    );

    const background = useTransform<number, string>(
        [glareX, glareY],
        ([lx, ly]: number[]) =>
            `radial-gradient(700px circle at ${lx}% ${ly}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.08) 40%, transparent 65%)`
    );

    return (
        <motion.div
            className="pointer-events-none absolute inset-0 z-30 rounded-[inherit]"
            style={{ background, opacity, mixBlendMode: "overlay" }}
        />
    );
}

/* ============================================================
   Dynamic Shadow — Shifts opposite to tilt for realism
   ============================================================ */
function useDynamicShadow(
    springX: MotionValue<number>,
    springY: MotionValue<number>
) {
    return useTransform<number, string>(
        [springX, springY],
        ([lx, ly]: number[]) => {
            const shadowX = lx * -20;
            const shadowY = ly * -20;
            const blur = 25 + Math.abs(lx * 8) + Math.abs(ly * 8);
            return [
                `${shadowX}px ${shadowY}px ${blur}px rgba(0,0,0,0.1)`,
                `0 2px 8px rgba(0,0,0,0.06)`,
                `inset 0 0 0 1px var(--glass-border)`,
            ].join(", ");
        }
    );
}

/* ============================================================
   Composited Transform — Inline perspective for correct vanishing point
   ============================================================
   Why inline perspective?
   CSS `perspective` on a parent sets the vanishing point at the
   parent's center — meaning cards at different grid positions
   get DIFFERENT perspective angles (asymmetric distortion).

   `transform: perspective(Xpx) rotateX() rotateY()` sets the
   vanishing point at the ELEMENT's own center, giving each card
   identical, symmetric, natural perspective. This is how
   vanilla-tilt.js does it.
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

    /* ---- Smooth spring → no oscillation due to high damping ---- */
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

    /* ---- Dynamic shadow ---- */
    const boxShadow = useDynamicShadow(springX, springY);

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
            boxShadow,
            transformStyle: "preserve-3d" as const,
            willChange: "transform" as const,
        };

    const cardClass = cn(
        "glass-card p-8 relative z-10 h-full",
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
