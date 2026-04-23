"use client";

import React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { GlassCard } from "@/components/glass-card";
import { ExternalLink, Star, GitFork } from "lucide-react";
import { SPRING_GENTLE } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface RepoStats {
    stars: number;
    forks: number;
}

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
    const { projects } = siteConfig;
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
        <GlassCard variant="panel" className="flex h-full flex-col p-5 md:p-6">
            <div className="flex flex-col">
                {sorted.map((project, i) => {
                    const repoStats = stats[project.url];

                    return (
                        <React.Fragment key={project.name}>
                            {i > 0 && (
                                <div
                                    className="h-px mx-1"
                                    style={{ background: "var(--glass-divider)" }}
                                />
                            )}
                            <motion.a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative flex flex-col gap-1.5 rounded-xl px-3 py-3 -mx-1 transition-colors hover:bg-[var(--surface-bg)] cursor-pointer"
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.97 }}
                                transition={SPRING_GENTLE}
                            >
                                {/* Left tint accent — appears on hover */}
                                <div
                                    className="absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    style={{ background: "var(--tint-color)" }}
                                />

                                {/* Name + external icon */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-[15px] text-text-primary group-hover:text-tint transition-colors duration-150 leading-snug">
                                        {project.name}
                                    </span>
                                    <div className="flex items-center gap-2.5 shrink-0">
                                        {repoStats && (
                                            <>
                                                <span className="flex items-center gap-0.5 text-[12px] text-text-tertiary">
                                                    <Star size={11} style={{ color: "#ff9f0a" }} />
                                                    {repoStats.stars}
                                                </span>
                                                <span className="flex items-center gap-0.5 text-[12px] text-text-tertiary">
                                                    <GitFork size={11} />
                                                    {repoStats.forks}
                                                </span>
                                            </>
                                        )}
                                        <ExternalLink
                                            size={12}
                                            className="text-text-tertiary opacity-0 group-hover:opacity-60 transition-opacity"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2">
                                    {project.description}
                                </p>

                                {/* Tags */}
                                {project.tags && project.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {project.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                                                style={{
                                                    background: "rgba(var(--tint-rgb), 0.08)",
                                                    color: "var(--tint-color)",
                                                    border: "1px solid rgba(var(--tint-rgb), 0.16)",
                                                }}
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
