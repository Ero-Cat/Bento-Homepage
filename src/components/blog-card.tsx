"use client";

import { Fragment, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Eye } from "lucide-react";
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

const feedbackSpring = {
    type: "spring" as const,
    stiffness: 260,
    damping: 28,
};

const headerLinkMotion = {
    rest: { color: "var(--text-tertiary)", transition: feedbackSpring },
    hover: { color: "var(--tint-color)", transition: feedbackSpring },
};

const headerIconMotion = {
    rest: { opacity: 0.52, transition: feedbackSpring },
    hover: { opacity: 1, transition: feedbackSpring },
};

const rowMaterialMotion = {
    rest: { opacity: 0, transition: feedbackSpring },
    hover: { opacity: 1, transition: feedbackSpring },
};

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
    const { cardTitles } = siteConfig;
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
        <GlassCard variant="panel" className="flex h-full flex-col gap-3 p-5 md:p-6">
            <header className="flex items-center justify-between gap-4">
                <h2 className="text-[22px] font-[650] leading-none text-text-primary">
                    {cardTitles.blog}
                </h2>
                <motion.a
                    href={blogConfig.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variants={headerLinkMotion}
                    initial="rest"
                    animate="rest"
                    whileHover="hover"
                    whileFocus="hover"
                    className="flex min-h-11 min-w-11 items-center justify-end gap-1 rounded-[12px] px-2 text-[12px] font-semibold text-text-tertiary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(var(--tint-rgb),0.42)]"
                >
                    {cardTitles.blogLink}
                    <motion.span variants={headerIconMotion} className="flex">
                        <ArrowUpRight size={12} aria-hidden="true" />
                    </motion.span>
                </motion.a>
            </header>

            <div className="-mx-1 flex min-h-0 flex-1 flex-col">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="-mx-2 flex min-h-11 flex-1 items-center px-3 py-2.5">
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                                <div
                                    className="h-[15px] rounded-[4px]"
                                    style={{
                                        width: `${58 + ((i * 13) % 32)}%`,
                                        background: "var(--glass-inner-bg)",
                                    }}
                                />
                                <div
                                    className="h-3 rounded-[3px]"
                                    style={{
                                        width: `${36 + ((i * 9) % 22)}%`,
                                        background: "rgba(var(--tint-rgb), 0.08)",
                                    }}
                                />
                            </div>
                        </div>
                    ))
                ) : posts.length > 0 ? (
                    posts.map((post, i) => (
                        <Fragment key={post.status.permalink}>
                            {i > 0 && (
                                <div
                                    className="mx-3 h-px shrink-0"
                                    style={{ background: "var(--glass-divider)" }}
                                />
                            )}
                            <motion.a
                                href={`${blogConfig.url}${post.status.permalink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial="rest"
                                animate="rest"
                                whileHover="hover"
                                whileFocus="hover"
                                className="relative -mx-2 flex min-h-11 flex-1 items-center overflow-hidden rounded-[12px] px-3 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(var(--tint-rgb),0.42)]"
                            >
                                <motion.span
                                    aria-hidden="true"
                                    variants={rowMaterialMotion}
                                    className="pointer-events-none absolute inset-0"
                                    style={{ background: "var(--glass-inner-bg)" }}
                                />
                                <div className="relative z-[1] min-w-0 flex-1">
                                    <h3 className="line-clamp-1 text-[15px] font-[640] leading-[1.3] text-text-primary">
                                        {post.spec.title}
                                    </h3>

                                    <div className="mt-2 flex min-w-0 items-center gap-2 text-[12px] font-medium leading-[1.25]">
                                        <span className="shrink-0 text-text-tertiary">
                                            {timeAgo(post.spec.publishTime)}
                                        </span>
                                        {post.categories?.[0] && (
                                            <>
                                                <span className="shrink-0 select-none text-text-tertiary" aria-hidden="true">
                                                    ·
                                                </span>
                                                <span
                                                    className="min-w-0 truncate"
                                                    style={{ color: "var(--tint-color)" }}
                                                >
                                                    {post.categories[0].spec.displayName}
                                                </span>
                                            </>
                                        )}
                                        <span
                                            aria-label={`${post.stats?.visit ?? 0} views`}
                                            className="ml-auto flex shrink-0 items-center gap-1 text-text-tertiary"
                                        >
                                            <Eye size={11} aria-hidden="true" />
                                            {post.stats?.visit ?? 0}
                                        </span>
                                    </div>
                                </div>
                            </motion.a>
                        </Fragment>
                    ))
                ) : (
                    <p className="text-[13px] py-6 text-center text-text-tertiary">
                        暂无博文
                    </p>
                )}
            </div>
        </GlassCard>
    );
}
