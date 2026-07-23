"use client";

import React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { GlassCard } from "@/components/glass-card";
import { ExternalLink, Star, GitFork } from "lucide-react";

interface RepoStats {
    stars: number;
    forks: number;
}

const hoverSpring = {
    type: "spring" as const,
    stiffness: 260,
    damping: 28,
};

const materialMotion = {
    rest: { opacity: 0, transition: hoverSpring },
    hover: { opacity: 1, transition: hoverSpring },
};

const externalIconMotion = {
    rest: { opacity: 0.28, transition: hoverSpring },
    hover: { opacity: 0.78, transition: hoverSpring },
};

/**
 * Extract GitHub owner/repo from a GitHub URL.
 * Returns null if the URL is not a GitHub repo link.
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
}

export function ProjectsCard() {
    const { cardTitles, projects } = siteConfig;
    const [stats, setStats] = useState<Record<string, RepoStats>>({});

    useEffect(() => {
        const fetchStats = async () => {
            const results: Record<string, RepoStats> = {};

            await Promise.all(
                projects.map(async (project) => {
                    const parsed = parseGitHubUrl(project.url);
                    if (!parsed) return;

                    try {
                        const res = await fetch(
                            `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`
                        );
                        if (!res.ok) return;
                        const data = await res.json();
                        results[project.url] = {
                            stars: data.stargazers_count ?? 0,
                            forks: data.forks_count ?? 0,
                        };
                    } catch {
                        // Silently fail — show project without stats
                    }
                })
            );

            setStats(results);
        };

        fetchStats();
    }, [projects]);

    // Sort projects by stars (descending), projects without stats go last
    const sorted = [...projects].sort((a, b) => {
        const starsA = stats[a.url]?.stars ?? -1;
        const starsB = stats[b.url]?.stars ?? -1;
        return starsB - starsA;
    });

    return (
        <GlassCard variant="panel" className="flex h-full flex-col gap-3 p-5 md:p-6">
            <header>
                <h2 className="text-[22px] font-[650] leading-none text-text-primary">
                    {cardTitles.projects}
                </h2>
            </header>

            <div className="flex min-h-0 flex-1 flex-col">
                {sorted.map((project, i) => {
                    const repoStats = stats[project.url];

                    return (
                        <React.Fragment key={project.name}>
                            {i > 0 && (
                                <div
                                    className="mx-2 h-px shrink-0"
                                    style={{ background: "var(--glass-divider)" }}
                                />
                            )}
                            <motion.a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial="rest"
                                animate="rest"
                                whileHover="hover"
                                whileFocus="hover"
                                className="relative -mx-2 flex flex-1 flex-col justify-center gap-2 overflow-hidden rounded-[16px] px-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgba(var(--tint-rgb),0.42)]"
                            >
                                <motion.span
                                    aria-hidden="true"
                                    variants={materialMotion}
                                    className="pointer-events-none absolute inset-0"
                                    style={{ background: "var(--glass-inner-bg)" }}
                                />

                                <div className="relative z-[1] flex items-center justify-between gap-3">
                                    <span className="text-[16px] font-[640] leading-snug text-text-primary">
                                        {project.name}
                                    </span>
                                    <div className="flex shrink-0 items-center gap-2.5">
                                        {repoStats && (
                                            <>
                                                <span className="flex items-center gap-1 text-[12px] tabular-nums text-text-tertiary">
                                                    <Star size={11} style={{ color: "var(--tint-color)" }} />
                                                    {repoStats.stars}
                                                </span>
                                                <span className="flex items-center gap-1 text-[12px] tabular-nums text-text-tertiary">
                                                    <GitFork size={11} />
                                                    {repoStats.forks}
                                                </span>
                                            </>
                                        )}
                                        <motion.span variants={externalIconMotion} className="flex text-text-tertiary">
                                            <ExternalLink size={13} aria-hidden="true" />
                                        </motion.span>
                                    </div>
                                </div>

                                <p className="relative z-[1] line-clamp-2 text-[13px] leading-[1.48] text-text-secondary">
                                    {project.description}
                                </p>

                                {project.tags && project.tags.length > 0 && (
                                    <div className="relative z-[1] flex flex-wrap gap-x-3 gap-y-1">
                                        {project.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="text-[11px] font-medium leading-none text-tint"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </motion.a>
                        </React.Fragment>
                    );
                })}
            </div>
        </GlassCard>
    );
}
