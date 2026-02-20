"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { GlassCard } from "@/components/glass-card";
import { SPRING_GENTLE } from "@/lib/motion";

/* ============================================================
   macOS-style App Icon — frosted glass tile with Ambient Glow
   Icon source: just drop .svg files into /public/icons/software/
   ============================================================ */
function AppIcon({ app }: { app: { name: string; icon: string } }) {
    const [imgError, setImgError] = useState(false);

    /*  Icon resolution:
     *   "docker"     → /icons/software/docker.svg  (local file)
     *   "https://…"  → Remote CDN URL
     *   ""           → First-letter fallback
     */
    const showFallback = !app.icon || imgError;
    const imgSrc = app.icon.startsWith("http")
        ? app.icon
        : `/icons/software/${app.icon}.svg`;

    const iconContent = showFallback ? (
        <span className="text-white/90 text-2xl font-bold drop-shadow-sm">
            {app.name.charAt(0)}
        </span>
    ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
            src={imgSrc}
            alt={app.name}
            className="w-full h-full object-contain drop-shadow-sm"
            loading="lazy"
            onError={() => setImgError(true)}
        />
    );

    return (
        <motion.div
            className="flex flex-col items-center gap-2 cursor-default select-none"
            whileHover={{ scale: 1.12, y: -3 }}
            transition={SPRING_GENTLE}
        >
            {/* Icon — rendered directly, no tile background */}
            <div className="w-[52px] h-[52px] flex items-center justify-center">
                {iconContent}
            </div>

            {/* Label */}
            <span className="text-[11px] text-text-secondary text-center leading-tight w-[64px] truncate">
                {app.name}
            </span>
        </motion.div>
    );
}

/* ============================================================
   SoftwareCard — macOS Window-style Bento Card
   ============================================================ */
export function SoftwareCard() {
    const { software } = siteConfig;

    return (
        <GlassCard className="flex flex-col gap-0 !p-0 overflow-hidden h-full">
            {/* ── macOS Title Bar with traffic lights ── */}
            <div
                className="flex items-center px-4 py-2.5"
                style={{ borderBottom: "1px solid var(--glass-border)" }}
            >
                {/* Traffic lights */}
                <div className="flex gap-[7px]">
                    <span className="w-[13px] h-[13px] rounded-full bg-[#FF5F57] shadow-inner" />
                    <span className="w-[13px] h-[13px] rounded-full bg-[#FEBC2E] shadow-inner" />
                    <span className="w-[13px] h-[13px] rounded-full bg-[#28C840] shadow-inner" />
                </div>

                {/* Centered title */}
                <span className="flex-1 text-center text-[13px] font-medium text-text-secondary tracking-wide">
                    Applications
                </span>

                {/* Spacer to balance traffic lights */}
                <div className="w-[55px]" />
            </div>

            {/* ── Launchpad-style App Grid ── */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-x-2 gap-y-4 p-5 place-items-center">
                {software.map((app) => (
                    <AppIcon key={app.name} app={app} />
                ))}
            </div>
        </GlassCard>
    );
}
