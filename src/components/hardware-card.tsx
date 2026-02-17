"use client";

import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { GlassCard } from "@/components/glass-card";
import { SPRING_GENTLE } from "@/lib/motion";

export function HardwareCard() {
    const { hardware } = siteConfig;

    return (
        <GlassCard className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-text-primary">Hardware</h2>
            <div className="flex flex-col gap-4">
                {hardware.map((group) => (
                    <div key={group.category} className="flex flex-col gap-2">
                        <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">
                            {group.category}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {group.items.map((item) => (
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
                    </div>
                ))}
            </div>
        </GlassCard>
    );
}
