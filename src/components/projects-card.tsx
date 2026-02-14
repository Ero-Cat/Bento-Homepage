"use client";

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
        <GlassCard className="flex flex-col gap-5">
            <h2 className="text-xl font-semibold text-text-primary">Projects</h2>
            <div className="flex flex-col gap-3">
                {sorted.map((project) => {
                    const repoStats = stats[project.url];

                    return (
                        <a
                            key={project.name}
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col gap-2 rounded-2xl p-4 -mx-2 transition-colors hover:bg-[rgba(var(--tint-rgb),0.06)]"
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-base text-text-primary group-hover:text-tint transition-colors">
                                    {project.name}
                                </span>

                                {/* Star & Fork badges */}
                                {repoStats && (
                                    <div className="flex items-center gap-3 ml-auto text-text-tertiary text-sm">
                                        <span className="flex items-center gap-1">
                                            <Star size={14} />
                                            {repoStats.stars}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <GitFork size={14} />
                                            {repoStats.forks}
                                        </span>
                                    </div>
                                )}

                                <ExternalLink
                                    size={14}
                                    className="text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                />
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed">
                                {project.description}
                            </p>
                            {project.tags && project.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {project.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-xs font-medium text-text-tertiary px-2.5 py-1 rounded-lg"
                                            style={{ background: "var(--icon-bg)" }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </a>
                    );
                })}
            </div>
        </GlassCard>
    );
}
