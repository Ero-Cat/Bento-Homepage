"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, ArrowUpRight, Eye } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { siteConfig } from "@/config/site";

/* ============================================================
   Blog Card — Halo 2.x Public Content API
   ============================================================ */

interface HaloPost {
    spec: {
        title: string;
        publishTime: string;
        cover: string;
    };
    status: {
        permalink: string;
        excerpt: string;
    };
    categories: {
        spec: { displayName: string };
    }[];
    stats: {
        visit: number;
    };
}

interface HaloResponse {
    items: HaloPost[];
    total: number;
}

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years}年前`;
    if (months > 0) return `${months}个月前`;
    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return "刚刚";
}

export function BlogCard() {
    const blogConfig = siteConfig.blog;
    const [posts, setPosts] = useState<HaloPost[]>([]);
    const [loading, setLoading] = useState(!!blogConfig?.url);

    useEffect(() => {
        if (!blogConfig?.url) return;

        const size = blogConfig.size ?? 5;
        fetch(
            `${blogConfig.url}/apis/api.content.halo.run/v1alpha1/posts?size=${size}&sort=spec.publishTime%2Cdesc`
        )
            .then((r) => r.json())
            .then((d: HaloResponse) => {
                setPosts(d.items ?? []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [blogConfig]);

    if (!blogConfig?.url) return null;

    return (
        <GlassCard variant="panel" className="flex flex-col gap-4 p-5 md:p-6 h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="w-[26px] h-[26px] rounded-[8px] flex items-center justify-center shrink-0"
                        style={{ background: "rgba(var(--tint-rgb), 0.10)" }}
                    >
                        <BookOpen size={13} style={{ color: "var(--tint-color)" }} />
                    </div>
                    <h3 className="text-[14px] font-semibold text-text-primary tracking-tight">博客</h3>
                </div>
                <a
                    href={blogConfig.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-0.5 text-[11px] font-medium text-text-tertiary hover:text-tint transition-colors duration-150"
                >
                    全部
                    <ArrowUpRight
                        size={11}
                        className="opacity-70 transition-opacity duration-150 group-hover:opacity-100"
                    />
                </a>
            </div>

            {/* Post List */}
            <div className="flex flex-col flex-1 gap-0.5 -mx-1">
                {loading ? (
                    /* Skeleton */
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-2.5 py-[10px] rounded-xl">
                            <div className="flex-1 flex flex-col gap-2">
                                <div
                                    className="h-3.5 rounded-full animate-pulse"
                                    style={{
                                        width: `${58 + ((i * 13) % 32)}%`,
                                        background: "var(--surface-bg-strong)",
                                    }}
                                />
                                <div
                                    className="h-2.5 rounded-full animate-pulse"
                                    style={{
                                        width: `${36 + ((i * 9) % 22)}%`,
                                        background: "var(--surface-bg)",
                                    }}
                                />
                            </div>
                        </div>
                    ))
                ) : posts.length > 0 ? (
                    posts.map((post, i) => (
                        <motion.a
                            key={post.status.permalink}
                            href={`${blogConfig.url}${post.status.permalink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="prism-panel prism-interactive group relative flex items-center gap-2 rounded-[14px] px-2.5 py-[10px]"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: i * 0.045,
                                type: "spring",
                                stiffness: 300,
                                damping: 26,
                            }}
                        >
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[13px] font-semibold leading-snug line-clamp-1 transition-colors duration-150 text-text-primary group-hover:text-tint">
                                    {post.spec.title}
                                </h4>

                                {/* Meta row */}
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-[11px] font-medium text-text-tertiary">
                                        {timeAgo(post.spec.publishTime)}
                                    </span>
                                    {post.categories?.[0] && (
                                        <>
                                            <span
                                                className="text-[10px] select-none"
                                                style={{ color: "var(--text-tertiary)", opacity: 0.4 }}
                                            >
                                                ·
                                            </span>
                                            <span className="prism-badge rounded-[5px] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide leading-none">
                                                {post.categories[0].spec.displayName}
                                            </span>
                                        </>
                                    )}
                                    <span
                                        className="ml-auto flex items-center gap-1 text-[11px]"
                                        style={{ color: "var(--text-tertiary)", opacity: 0.55 }}
                                    >
                                        <Eye size={10} />
                                        {post.stats?.visit ?? 0}
                                    </span>
                                </div>
                            </div>

                        </motion.a>
                    ))
                ) : (
                    <p
                        className="text-[13px] py-6 text-center"
                        style={{ color: "var(--text-tertiary)", opacity: 0.55 }}
                    >
                        暂无博文
                    </p>
                )}
            </div>
        </GlassCard>
    );
}
