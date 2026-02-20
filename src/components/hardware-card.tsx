"use client";

import { motion } from "framer-motion";
import {
    Apple,
    Monitor,
    Keyboard,
    Printer,
    Wifi,
    type LucideIcon,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { GlassCard } from "@/components/glass-card";
import { SPRING_GENTLE } from "@/lib/motion";

/* ── Lucide icon lookup ─────────────────────────────────────── */
const ICON_MAP: Record<string, LucideIcon> = {
    Apple,
    Monitor,
    Keyboard,
    Printer,
    Wifi,
};

/* ── Category Row ───────────────────────────────────────────── */
function CategoryRow({
    group,
    isLast,
}: {
    group: (typeof siteConfig.hardware)[number];
    isLast: boolean;
}) {
    const Icon = ICON_MAP[group.icon];

    return (
        <div
            className="flex flex-col gap-2.5"
            style={
                isLast
                    ? undefined
                    : {
                        paddingBottom: "10px",
                        borderBottom: "1px solid var(--glass-border)",
                    }
            }
        >
            {/* Category header — icon + label */}
            <div className="flex items-center gap-2">
                {Icon && (
                    <Icon
                        size={15}
                        strokeWidth={2}
                        style={{ color: "var(--tint-color)", flexShrink: 0 }}
                    />
                )}
                <span className="text-sm font-semibold text-text-tertiary uppercase tracking-wider">
                    {group.category}
                </span>
            </div>

            {/* Item chips */}
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
    );
}

/* ── HardwareCard ───────────────────────────────────────────── */
export function HardwareCard() {
    const { hardware } = siteConfig;

    return (
        <GlassCard className="flex flex-col gap-3 h-full">
            {/* <h2 className="text-xl font-semibold text-text-primary">
                Hardware
            </h2> */}
            <div className="flex flex-col gap-4">
                {hardware.map((group, i) => (
                    <CategoryRow
                        key={group.category}
                        group={group}
                        isLast={i === hardware.length - 1}
                    />
                ))}
            </div>
        </GlassCard>
    );
}
