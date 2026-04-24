"use client";

import React from "react";
import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import { GlassCard } from "@/components/glass-card";
import { ExternalLink, Star, GitFork } from "lucide-react";

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
                            <a
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="prism-panel prism-interactive group relative flex flex-col gap-1.5 rounded-[14px] px-3 py-2.5 -mx-1"
                            >
                                {/* Name + external icon */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-[15px] text-text-primary group-hover:text-tint transition-colors duration-150 leading-snug">
                                        {project.name}
                                    </span>
                                    <div className="flex items-center gap-2.5 shrink-0">
                                        {repoStats && (
                                            <>
                                                <span className="flex items-center gap-0.5 text-[12px] text-text-tertiary">
                                                    <Star size={11} style={{ color: "var(--tint-color)" }} />
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
                                            className="text-text-tertiary opacity-35 group-hover:opacity-60 transition-opacity duration-150"
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
                                                className="prism-badge prism-static inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </a>
                        </React.Fragment>
                    );
                })}
            </div>
        </GlassCard>
    );
}
