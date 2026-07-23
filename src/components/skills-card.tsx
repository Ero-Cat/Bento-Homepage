"use client";

import { motion } from "framer-motion";
import {
    Blocks,
    Bot,
    Box,
    Boxes,
    Braces,
    Code2,
    Crosshair,
    Headset,
    HousePlug,
    Router,
    ServerCog,
    Wrench,
    type LucideIcon,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { GlassCard } from "@/components/glass-card";

const ICON_MAP: Record<string, LucideIcon> = {
    Blocks,
    Bot,
    Box,
    Boxes,
    Braces,
    Code2,
    Crosshair,
    Headset,
    HousePlug,
    Router,
    ServerCog,
    Wrench,
};

const ACCENT_RGB = {
    blue: "var(--system-blue-rgb)",
    green: "var(--system-green-rgb)",
    orange: "var(--system-orange-rgb)",
    purple: "var(--system-purple-rgb)",
    red: "var(--system-red-rgb)",
    mint: "var(--system-mint-rgb)",
} as const;

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
    hidden: { opacity: 0, y: 5 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
};

export function SkillsCard() {
    const { cardTitles, interests } = siteConfig;

    return (
        <GlassCard variant="dense" className="flex h-full flex-col gap-3 p-5 md:p-6">
            <header>
                <h2 className="text-[22px] font-[650] leading-none text-text-primary">
                    {cardTitles.interests}
                </h2>
            </header>

            <motion.div
                className="grid min-h-0 flex-1 grid-cols-2 content-center gap-2 md:grid-cols-3 lg:grid-cols-4"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {interests.map((interest) => {
                    const Icon = ICON_MAP[interest.icon];
                    const accentRgb = ACCENT_RGB[interest.accent];

                    return (
                        <motion.div
                            key={interest.label}
                            variants={item}
                            className="flex min-w-0 select-none items-center gap-2.5 rounded-[12px] px-2.5 py-2 md:gap-1 md:px-1.5 md:py-1 lg:gap-2.5 lg:px-2.5 lg:py-2"
                            style={{ background: `rgba(${accentRgb}, 0.055)` }}
                        >
                            {Icon && (
                                <span
                                    className="flex w-7 h-7 shrink-0 items-center justify-center rounded-[9px] md:w-5 md:h-5 lg:w-7 lg:h-7"
                                    style={{
                                        color: `rgb(${accentRgb})`,
                                        background: `rgba(${accentRgb}, 0.12)`,
                                    }}
                                >
                                    <Icon size={14} strokeWidth={2.2} aria-hidden="true" />
                                </span>
                            )}
                            <span className="min-w-0 truncate text-[13px] font-medium leading-tight text-text-secondary md:whitespace-normal md:overflow-visible md:text-clip md:text-[10.5px] lg:truncate lg:text-[13px]">
                                {interest.label}
                            </span>
                        </motion.div>
                    );
                })}
            </motion.div>
        </GlassCard>
    );
}
