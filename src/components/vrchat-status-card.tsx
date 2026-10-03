"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/glass-card";
import { siteConfig } from "@/config/site";

/* ============================================================
   VRChat Status Card — VRCX-Cloud Public API
   GET {apiBase}/api/public/profile
   ============================================================ */

/** /api/public/profile 返回的 profile 投影（见 VRCX-Cloud PUBLIC-API 文档） */
interface VRCXProfile {
    id: string;
    displayName: string | null;
    status: string | null;
    statusDescription: string | null;
    bio: string | null;
    pronouns: string | null;
    profilePicOverride: string | null;
    userIcon?: string | null;
    iconUrl?: string | null;
    currentAvatarImageUrl: string | null;
    currentAvatarThumbnailImageUrl: string | null;
    lastPlatform: string | null;
    friendsCount?: number | null;
    tags: string[] | null;
}

interface VRCXProfileResponse {
    ok: boolean;
    profile?: VRCXProfile;
    error?: string;
    message?: string;
    generatedAt?: string;
}

/* ── Status color / label mapping（VRChat 状态枚举）── */
const STATUS_MAP: Record<string, { color: string; label: string; pulse: boolean }> = {
    "join me": { color: "#42caff", label: "Join Me", pulse: true },
    active: { color: "#55ff6e", label: "Online", pulse: true },
    "ask me": { color: "#e8a838", label: "Ask Me", pulse: true },
    busy: { color: "#5b0b0b", label: "Do Not Disturb", pulse: false },
    offline: { color: "#6b7280", label: "Offline", pulse: false },
};

/* ── lastPlatform → short label ── */
const PLATFORM_LABELS: Record<string, string> = {
    standalonewindows: "PC",
    steam: "Steam",
    android: "Quest",
    ios: "iOS",
    website: "Web",
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

    const [data, setData] = useState<VRCXProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    /* 轮询期间短暂失败（限流 / 未水合）时保留上一次数据，仅首次加载展示错误 */
    const hasDataRef = useRef(false);

    const fetchStatus = useCallback(() => {
        if (!config) return;
        fetch(`${config.apiBase}/api/public/profile`)
            .then((r) => {
                if (!r.ok) throw new Error("fetch failed");
                return r.json() as Promise<VRCXProfileResponse>;
            })
            .then((d) => {
                /* 业务错误（未登录 / 资料未水合）同样返回 HTTP 200 + ok: false */
                if (!d.ok || !d.profile) throw new Error(d.error ?? "profile unavailable");
                hasDataRef.current = true;
                setData(d.profile);
                setError(false);
                setLoading(false);
            })
            .catch(() => {
                if (!hasDataRef.current) {
                    setError(true);
                    setLoading(false);
                }
            });
    }, [config]);

    useEffect(() => {
        fetchStatus();
        const timer = setInterval(fetchStatus, POLL_INTERVAL);
        return () => clearInterval(timer);
    }, [fetchStatus]);

    if (!config) return null;

    const statusInfo = data
        ? STATUS_MAP[data.status ?? "offline"] ?? STATUS_MAP.offline
        : STATUS_MAP.offline;
    const trustRank = data ? getTrustRank(data.tags ?? []) : null;
    const badges = data ? getBadges(data.tags ?? []) : [];
    const avatarUrl = data?.profilePicOverride || data?.currentAvatarThumbnailImageUrl || "";
    /* 新接口不再提供 lastLoginAt；底部元信息回退为 pronouns / 最近登录平台 */
    const footerMeta =
        data?.pronouns?.trim() ||
        (data?.lastPlatform ? PLATFORM_LABELS[data.lastPlatform] ?? data.lastPlatform : "");

    return (
        <GlassCard variant="panel" className="flex flex-col gap-3 p-5 h-full">
            {loading ? (
                /* ── Skeleton ── */
                <div className="flex flex-col gap-3 animate-pulse">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-14 h-14 rounded-full shrink-0"
                            style={{ backgroundColor: "var(--glass-inner-border)" }}
                        />
                        <div className="flex flex-col gap-2 flex-1">
                            <div className="h-4 w-28 rounded" style={{ backgroundColor: "var(--glass-inner-border)" }} />
                            <div className="h-3 w-20 rounded" style={{ backgroundColor: "var(--glass-inner-border)", opacity: 0.5 }} />
                        </div>
                    </div>
                    <div className="h-12 rounded" style={{ backgroundColor: "var(--glass-inner-border)", opacity: 0.3 }} />
                </div>
            ) : error ? (
                <p className="text-sm text-text-tertiary text-center py-4">无法加载 VRChat 状态</p>
            ) : data ? (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={data.status ?? "offline"}
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
                                        borderColor: "var(--glass-inner-bg)",
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

                        {/* ── Footer: Trust Rank + Age Verified + Meta ── */}
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
                                {data.tags?.some(t => t === "system_age_verified" || t === "system_feedback_access") && (
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
                            {footerMeta && (
                                <span className="truncate max-w-[50%] text-right">{footerMeta}</span>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            ) : null}
        </GlassCard>
    );
}
