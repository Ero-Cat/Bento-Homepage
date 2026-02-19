"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Eye, ArrowUpRight } from "lucide-react";
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

function truncate(str: string, len: number): string {
    if (!str) return "";
    return str.length > len ? str.slice(0, len) + "…" : str;
}

export function BlogCard() {
    const blogConfig = siteConfig.blog;
    const [posts, setPosts] = useState<HaloPost[]>([]);
    // Initialize loading based on config presence
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
        <GlassCard className="flex flex-col gap-3 p-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-text-secondary" />
                    <h3 className="text-lg font-semibold text-text-primary">最近博文</h3>
                </div>
                <a
                    href={blogConfig.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-primary transition-colors"
                >
                    查看全部
                    <ArrowUpRight size={12} />
                </a>
            </div>

            {/* Post List */}
            <div className="flex flex-col">
                {loading ? (
                    /* Skeleton */
                    Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex flex-col gap-2 py-3"
                            style={{
                                borderBottom:
                                    i < 3 ? "1px solid var(--glass-border)" : "none",
                            }}
                        >
                            <div
                                className="h-4 rounded-md animate-pulse"
                                style={{
                                    width: `${60 + ((i * 13) % 30)}%`,
                                    backgroundColor: "var(--glass-border)",
                                }}
                            />
                            <div
                                className="h-3 rounded-md animate-pulse"
                                style={{
                                    width: `${80 + ((i * 7) % 15)}%`,
                                    backgroundColor: "var(--glass-border)",
                                    opacity: 0.5,
                                }}
                            />
                        </div>
                    ))
                ) : posts.length > 0 ? (
                    posts.map((post, i) => (
                        <motion.a
                            key={post.status.permalink}
                            href={`${blogConfig.url}${post.status.permalink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col gap-1.5 py-3 group cursor-pointer"
                            style={{
                                borderBottom:
                                    i < posts.length - 1
                                        ? "1px solid var(--glass-border)"
                                        : "none",
                            }}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: i * 0.05,
                                type: "spring",
                                stiffness: 200,
                                damping: 20,
                            }}
                        >
                            {/* Title */}
                            <h4 className="text-sm font-medium text-text-primary group-hover:text-[var(--tint)] transition-colors leading-snug">
                                {post.spec.title}
                            </h4>

                            {/* Excerpt */}
                            <p className="text-xs text-text-tertiary leading-relaxed line-clamp-2">
                                {truncate(post.status.excerpt, 80)}
                            </p>

                            {/* Meta row */}
                            <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
                                <span>{timeAgo(post.spec.publishTime)}</span>
                                {post.categories?.[0] && (
                                    <span
                                        className="px-1.5 py-0.5 rounded-md"
                                        style={{
                                            backgroundColor: "rgba(var(--tint-rgb), 0.1)",
                                            color: "var(--tint)",
                                        }}
                                    >
                                        {post.categories[0].spec.displayName}
                                    </span>
                                )}
                                <span className="flex items-center gap-0.5">
                                    <Eye size={11} />
                                    {post.stats?.visit ?? 0}
                                </span>
                            </div>
                        </motion.a>
                    ))
                ) : (
                    <p className="text-sm text-text-tertiary py-4 text-center">
                        暂无博文
                    </p>
                )}
            </div>
        </GlassCard>
    );
}
