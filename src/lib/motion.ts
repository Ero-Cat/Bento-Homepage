import type { Variants } from "framer-motion";

// ============================================================
// Spring Physics Presets
// ============================================================

/** Standard interactive feedback — button press, card tap */
export const SPRING_INTERACTIVE = {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
};

/** Entrance animation — elements sliding in from below */
export const SPRING_ENTRANCE = {
    type: "spring" as const,
    stiffness: 200,
    damping: 25,
};

/** Gentle hover — subtle state changes */
export const SPRING_GENTLE = {
    type: "spring" as const,
    stiffness: 150,
    damping: 15,
};

// ============================================================
// Stagger Entrance Variants
// ============================================================

/** Parent container — controls staggered children entrance */
export const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.15,
        },
    },
};

/** Child item — individual card entrance animation */
export const itemVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 24,
        scale: 0.96,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: SPRING_ENTRANCE,
    },
};
