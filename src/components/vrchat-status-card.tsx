"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/glass-card";
import { siteConfig } from "@/config/site";

/* ============================================================
   VRChat Status Card — VRCX-Cloud Public API
   ============================================================ */

interface VRChatStatus {
    vrchatUserId: string;
    displayName: string;
    status: string;
    statusDescription: string;
    currentAvatarThumbnailImageUrl: string;
    profilePicOverride: string;
    userIcon: string;
    bio: string;
    tags: string[];
    lastLoginAt: string;
}

/* ── Status color / label mapping ── */
const STATUS_MAP: Record<string, { color: string; label: string; pulse: boolean }> = {
    "join me": { color: "#42caff", label: "Join Me", pulse: true },
    online: { color: "#55ff6e", label: "Online", pulse: true },
    "ask me": { color: "#e8a838", label: "Ask Me", pulse: true },
    busy: { color: "#5b0b0b", label: "Do Not Disturb", pulse: false },
    offline: { color: "#6b7280", label: "Offline", pulse: false },
};

/* ── Trust rank extraction from tags ── */
const TRUST_RANKS = [
    { tag: "system_trust_legend", label: "Legendary User", color: "#FFD000" },
    { tag: "system_trust_veteran", label: "Trusted User", color: "#8143E6" },
    { tag: "system_trust_trusted", label: "Known User", color: "#FF7B42" },
    { tag: "system_trust_known", label: "User", color: "#2BCF5C" },
    { tag: "system_trust_basic", label: "New User", color: "#1778FF" },
];

/* ── VRChat badge images (from assets.vrchat.com) ── */
const BADGE_MAP: { tag: string; src: string; title: string }[] = [
    {
        tag: "system_supporter",
        src: "https://assets.vrchat.com/badges/fa/bdgai_583f6b13-91ab-4e1b-974e-ab91600b06cb.png",
        title: "VRC+",
    },
    {
        tag: "system_early_adopter",
        src: "https://assets.vrchat.com/badges/fa/bdgai_89543a26-3442-43c5-8498-c79a21a1e53b.png",
        title: "Early Adopter",
    },
];

function getTrustRank(tags: string[]): { label: string; color: string } | null {
    for (const rank of TRUST_RANKS) {
        if (tags.includes(rank.tag)) return rank;
    }
    return null;
}

function getBadges(tags: string[]): { src: string; title: string }[] {
    return BADGE_MAP.filter((b) => tags.includes(b.tag));
}

const POLL_INTERVAL = 15_000;

export function VRChatStatusCard() {
    const config = siteConfig.vrchat;
    const bioLines = config?.bioLines ?? 3;

    const [data, setData] = useState<VRChatStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    /* ── Hydration-safe relative time ── */
    const [lastLoginLabel, setLastLoginLabel] = useState<string>("");
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const computeTimeAgo = useCallback((dateStr: string | undefined) => {
        if (!dateStr) { setLastLoginLabel(""); return; }
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (days > 0) setLastLoginLabel(`${days}天前`);
        else if (hours > 0) setLastLoginLabel(`${hours}小时前`);
        else if (minutes > 0) setLastLoginLabel(`${minutes}分钟前`);
        else setLastLoginLabel("刚刚");
    }, []);

    const fetchStatus = useCallback(() => {
        if (!config) return;
        fetch(`${config.apiBase}/api/v1/public/users/${config.userId}/status`)
            .then((r) => {
                if (!r.ok) throw new Error("fetch failed");
                return r.json();
            })
            .then((d: VRChatStatus) => {
                setData(d);
                setError(false);
                setLoading(false);
                computeTimeAgo(d.lastLoginAt);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, [config, computeTimeAgo]);

    useEffect(() => {
        fetchStatus();
        const timer = setInterval(fetchStatus, POLL_INTERVAL);
        return () => clearInterval(timer);
    }, [fetchStatus]);

    /* Update relative time every minute */
    useEffect(() => {
        timerRef.current = setInterval(() => {
            computeTimeAgo(data?.lastLoginAt);
        }, 60_000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [data?.lastLoginAt, computeTimeAgo]);

    if (!config) return null;

    const statusInfo = data ? STATUS_MAP[data.status] ?? STATUS_MAP.offline : STATUS_MAP.offline;
    const trustRank = data ? getTrustRank(data.tags) : null;
    const badges = data ? getBadges(data.tags) : [];
    const avatarUrl = data?.profilePicOverride || data?.currentAvatarThumbnailImageUrl || "";

    return (
        <GlassCard className="flex flex-col gap-3 p-5 h-full">
            {loading ? (
                /* ── Skeleton ── */
                <div className="flex flex-col gap-3 animate-pulse">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-14 h-14 rounded-full shrink-0"
                            style={{ backgroundColor: "var(--glass-border)" }}
                        />
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="h-4 w-28 rounded" style={{ backgroundColor: "var(--glass-border)" }} />
                            <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--glass-border)", opacity: 0.5 }} />
                        </div>
                    </div>
                    <div className="h-12 rounded" style={{ backgroundColor: "var(--glass-border)", opacity: 0.3 }} />
                </div>
            ) : error ? (
                <p className="text-sm text-text-tertiary text-center py-4">无法加载 VRChat 状态</p>
            ) : data ? (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={data.status}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="flex flex-col gap-3"
                    >
                        {/* ── Header: Avatar + Status ── */}
                        <div className="flex flex-col items-center gap-3">
                            {/* Avatar with status ring */}
                            <div className="relative shrink-0">
                                <img
                                    src={avatarUrl}
                                    alt="Avatar"
                                    className="object-cover w-20 h-20 rounded-full"
                                    style={{ border: `2px solid ${statusInfo.color}` }}
                                />
                                {/* Status dot */}
                                <span
                                    className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2"
                                    style={{
                                        backgroundColor: statusInfo.color,
                                        borderColor: "var(--glass-bg)",
                                        animation: statusInfo.pulse ? "pulse 2s ease-in-out infinite" : "none",
                                    }}
                                />
                            </div>

                            {/* Name + Badges + Status */}
                            <div className="flex flex-col items-center gap-0.5 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                                    <h3 className="text-base font-semibold text-text-primary text-center">
                                        {data.displayName}
                                    </h3>
                                    {badges.map((badge) => (
                                        <img
                                            key={badge.title}
                                            src={badge.src}
                                            alt={badge.title}
                                            title={badge.title}
                                            width={18}
                                            height={18}
                                            className="w-[18px] h-[18px] shrink-0 object-contain"
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className="inline-block w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: statusInfo.color }}
                                    />
                                    <span className="text-xs text-text-secondary font-medium">
                                        {statusInfo.label}
                                    </span>
                                    {data.statusDescription && (
                                        <span className="text-xs text-text-tertiary truncate">
                                            · {data.statusDescription}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Bio (configurable line clamp) ── */}
                        {data.bio && (
                            <p
                                className="text-xs text-text-tertiary leading-relaxed overflow-hidden"
                                style={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: bioLines,
                                    WebkitBoxOrient: "vertical",
                                    whiteSpace: "pre-line",
                                }}
                            >
                                {data.bio}
                            </p>
                        )}

                        {/* ── Footer: Trust Rank + Age Verified + Last Login ── */}
                        <div className="flex items-center justify-between text-[11px] text-text-tertiary">
                            <div className="flex items-center gap-1.5">
                                {trustRank && (
                                    <span
                                        className="px-2 py-0.5 rounded-full font-medium"
                                        style={{
                                            backgroundColor: `${trustRank.color}20`,
                                            color: trustRank.color,
                                        }}
                                    >
                                        {trustRank.label}
                                    </span>
                                )}
                                {data.tags.some(t => t === "system_age_verified" || t === "system_feedback_access") && (
                                    <span
                                        className="px-2 py-0.5 rounded-full font-medium"
                                        style={{
                                            backgroundColor: "rgba(45, 212, 191, 0.12)",
                                            color: "#2dd4bf",
                                        }}
                                    >
                                        18+
                                    </span>
                                )}
                            </div>
                            {lastLoginLabel && (
                                <span className="flex items-center gap-1">
                                    🕐 {lastLoginLabel}
                                </span>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            ) : null}
        </GlassCard>
    );
}
