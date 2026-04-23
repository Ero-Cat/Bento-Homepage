"use client";

import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { GlassCard } from "@/components/glass-card";

const container = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.045,
            delayChildren: 0.06,
        },
    },
};

const item = {
    hidden: { opacity: 0, scale: 0.88, y: 4 },
    show: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 320, damping: 22 },
    },
};

export function SkillsCard() {
    const { interests } = siteConfig;

    return (
        <GlassCard variant="dense" className="flex h-full flex-col items-center justify-center p-5 md:p-6">
            <motion.div
                className="flex flex-wrap justify-center gap-2"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {interests.map((interest) => (
                    <motion.span
                        key={interest}
                        variants={item}
                        className="prism-pill prism-interactive inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-medium select-none"
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.96 }}
                    >
                        {interest}
                    </motion.span>
                ))}
            </motion.div>
        </GlassCard>
    );
}
