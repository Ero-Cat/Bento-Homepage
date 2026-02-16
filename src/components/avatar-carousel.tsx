"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ============================================================
   Animation Config — Replicates ericwu.me rotation effect
   ============================================================ */
const avatarVariants = {
    enter: { scale: 1, opacity: 1, rotate: 0 },
    exit: { scale: 0, opacity: 0, rotate: 360 },
};

const spring = {
    type: "spring" as const,
    stiffness: 50,
    damping: 10,
    mass: 0.8,
};

const pingVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: {
        scale: [0.9, 2.5],
        opacity: [0.6, 0],
        transition: { duration: 1.5, repeat: 0 },
    },
};

const INTERVAL_MS = 5_000; // 5 seconds auto-cycle

/* ============================================================
   AvatarCarousel Component
   ============================================================ */
interface AvatarCarouselProps {
    images: string[];
    size?: number;
    alt?: string;
}

export function AvatarCarousel({
    images,
    size = 140,
    alt = "Avatar",
}: AvatarCarouselProps) {
    const [index, setIndex] = useState(0);
    const [pingKey, setPingKey] = useState(0);

    const hasMultiple = images.length > 1;

    const advance = useCallback(() => {
        if (!hasMultiple) return;
        setIndex((prev) => (prev + 1) % images.length);
        setPingKey((prev) => prev + 1);
    }, [hasMultiple, images.length]);

    // Auto-cycle
    useEffect(() => {
        if (!hasMultiple) return;
        const timer = setInterval(advance, INTERVAL_MS);
        return () => clearInterval(timer);
    }, [advance, hasMultiple]);

    const handleClick = useCallback(() => {
        advance();
    }, [advance]);

    return (
        <div
            className="relative shrink-0"
            style={{ width: size, height: size, cursor: hasMultiple ? "pointer" : "default" }}
            onClick={handleClick}
        >
            {/* Ping glow effect — triggers on each switch */}
            {hasMultiple && (
                <motion.div
                    key={pingKey}
                    className="absolute inset-0 m-auto rounded-full opacity-60 blur-md"
                    style={{
                        background: `radial-gradient(circle, rgba(var(--tint-rgb), 0.6) 0%, transparent 70%)`,
                    }}
                    variants={pingVariants}
                    initial="initial"
                    animate="animate"
                />
            )}

            {/* Avatar rotation transition */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={images[index]}
                    className="absolute inset-0 rounded-full flex items-center justify-center"
                    variants={avatarVariants}
                    initial="exit"
                    animate="enter"
                    exit="exit"
                    transition={spring}
                >
                    <img
                        src={images[index]}
                        alt={alt}
                        width={size}
                        height={size}
                        className="rounded-full border-2 object-cover"
                        style={{
                            width: size,
                            height: size,
                            borderColor: "var(--glass-border)",
                        }}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
