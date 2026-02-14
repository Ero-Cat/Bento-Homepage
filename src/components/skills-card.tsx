"use client";

import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { GlassCard } from "@/components/glass-card";
import { SPRING_GENTLE } from "@/lib/motion";

export function SkillsCard() {
    const { interests } = siteConfig;

    return (
        <GlassCard className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-text-primary">✨ Interests</h2>
            <div className="flex flex-wrap gap-2.5">
                {interests.map((item) => (
                    <motion.span
                        key={item}
                        className="pill-tag"
                        whileHover={{
                            scale: 1.08,
                            boxShadow: `0 0 20px rgba(var(--tint-rgb), 0.25)`,
                        }}
                        transition={SPRING_GENTLE}
                    >
                        {item}
                    </motion.span>
                ))}
            </div>
        </GlassCard>
    );
}
