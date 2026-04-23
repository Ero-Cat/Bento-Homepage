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

/** Apple-system accent colors per hardware category */
const CATEGORY_COLORS: Record<string, string> = {
    Apple: "#007aff",      // System Blue
    Monitor: "#30d158",    // System Green
    Keyboard: "#ff9f0a",   // System Orange
    Printer: "#bf5af2",    // System Purple
    Wifi: "#32d74b",       // System Mint
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
    const accent = CATEGORY_COLORS[group.icon] ?? "#007aff";

    return (
        <div
            className="flex flex-col gap-2"
            style={
                isLast
                    ? undefined
                    : {
                        paddingBottom: "10px",
                        borderBottom: "1px solid var(--glass-divider)",
                    }
            }
        >
            {/* Category header — colored icon bubble + label */}
            <div className="flex items-center gap-2">
                {Icon && (
                    <div
                        className="flex items-center justify-center w-6 h-6 rounded-lg shrink-0"
                        style={{ background: `${accent}1a` }}
                    >
                        <Icon
                            size={13}
                            strokeWidth={2.5}
                            style={{ color: accent }}
                        />
                    </div>
                )}
                <span
                    className="text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: accent, opacity: 0.85 }}
                >
                    {group.category}
                </span>
            </div>

            {/* Item chips — tinted with category accent */}
            <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                    <motion.span
                        key={item}
                        className="prism-pill prism-interactive inline-flex items-center rounded-full px-3 py-1 text-[13px] font-medium"
                        style={{
                            background: `${accent}10`,
                            borderColor: `${accent}28`,
                        }}
                        whileHover={{ scale: 1.04 }}                        whileTap={{ scale: 0.95 }}                        transition={SPRING_GENTLE}
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
        <GlassCard variant="panel" className="flex h-full flex-col gap-3 p-5 md:p-6">
            <div className="flex flex-col gap-3.5">
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
