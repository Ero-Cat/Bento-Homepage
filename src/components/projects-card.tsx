"use client";

import React from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { GlassCard } from "@/components/glass-card";
import { ExternalLink, Star, GitFork } from "lucide-react";

interface Repo {
    key: string;
    name: string;
    description: string | null;
    url: string;
    language: string | null;
    stars: number;
    forks: number;
    pushedAt: string;
}

interface RepoApi {
    name: string;
    full_name: string;
    html_url: string;
    description: string | null;
    language: string | null;
    fork: boolean;
    stargazers_count: number;
    forks_count: number;
    pushed_at: string;
}

const MAX_VISIBLE_PROJECTS = 3;
const REPOS_PER_PAGE = 100;
const MAX_REPO_PAGES = 3;

const hoverSpring = {
    type: "spring" as const,
    stiffness: 260,
    damping: 28,
};

const enterSpring = {
    type: "spring" as const,
    stiffness: 190,
    damping: 26,
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
 * Fetch the user's public GitHub repos (forks excluded) and keep the top ones
 * by stars. The /users/:name/repos endpoint ignores sort=stars, so ordering is
 * done client-side.
 */
async function fetchTopRepos(username: string, limit: number): Promise<Repo[]> {
    const repos: Repo[] = [];

    for (let page = 1; page <= MAX_REPO_PAGES; page++) {
        const res = await fetch(
            `https://api.github.com/users/${encodeURIComponent(username)}/repos?type=owner&per_page=${REPOS_PER_PAGE}&page=${page}`
        );
        if (!res.ok) throw new Error(`GitHub API responded with ${res.status}`);

        const data = (await res.json()) as RepoApi[];
        if (!Array.isArray(data)) throw new Error("Unexpected GitHub API payload");

        for (const repo of data) {
            if (repo.fork) continue;
            repos.push({
                key: repo.full_name,
                name: repo.name,
                description: repo.description ?? null,
                url: repo.html_url,
                language: repo.language ?? null,
                stars: repo.stargazers_count ?? 0,
                forks: repo.forks_count ?? 0,
                pushedAt: repo.pushed_at ?? "",
            });
        }

        if (data.length < REPOS_PER_PAGE) break;
    }

    // Stars descending; recently pushed repos win ties
    repos.sort((a, b) => b.stars - a.stars || b.pushedAt.localeCompare(a.pushedAt));
    return repos.slice(0, limit);
}

export function ProjectsCard() {
    const { cardTitles } = siteConfig;
    const username = siteConfig.github?.username;
    const [repos, setRepos] = useState<Repo[] | null>(null);
    const [failed, setFailed] = useState(false);

    const loadFailed = failed || !username;

    useEffect(() => {
        if (!username) return;

        let cancelled = false;
        fetchTopRepos(username, MAX_VISIBLE_PROJECTS)
            .then((list) => {
                if (!cancelled) setRepos(list);
            })
            .catch(() => {
                if (!cancelled) setFailed(true);
            });

        return () => {
            cancelled = true;
        };
    }, [username]);

    return (
        <GlassCard variant="panel" className="flex h-full flex-col gap-3 p-5 md:p-6">
            <header>
                <h2 className="text-[22px] font-[650] leading-none text-text-primary">
                    {cardTitles.projects}
                </h2>
            </header>

            <div className="flex min-h-0 flex-1 flex-col">
                {loadFailed ? (
                    <p className="flex flex-1 items-center justify-center px-3 text-center text-[13px] text-text-tertiary">
                        GitHub 项目暂时无法加载
                    </p>
                ) : (
                    repos &&
                    repos.length > 0 && (
                        <motion.div
                            className="flex min-h-0 flex-1 flex-col"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={enterSpring}
                        >
                            {repos.map((repo, i) => (
                                <React.Fragment key={repo.key}>
                                    {i > 0 && (
                                        <div
                                            className="mx-2 h-px shrink-0"
                                            style={{ background: "var(--glass-divider)" }}
                                        />
                                    )}
                                    <motion.a
                                        href={repo.url}
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
                                                {repo.name}
                                            </span>
                                            <div className="flex shrink-0 items-center gap-2.5">
                                                <span className="flex items-center gap-1 text-[12px] tabular-nums text-text-tertiary">
                                                    <Star size={11} style={{ color: "var(--tint-color)" }} />
                                                    {repo.stars}
                                                </span>
                                                <span className="flex items-center gap-1 text-[12px] tabular-nums text-text-tertiary">
                                                    <GitFork size={11} />
                                                    {repo.forks}
                                                </span>
                                                <motion.span variants={externalIconMotion} className="flex text-text-tertiary">
                                                    <ExternalLink size={13} aria-hidden="true" />
                                                </motion.span>
                                            </div>
                                        </div>

                                        {repo.description && (
                                            <p className="relative z-[1] line-clamp-2 text-[13px] leading-[1.48] text-text-secondary">
                                                {repo.description}
                                            </p>
                                        )}

                                        {repo.language && (
                                            <div className="relative z-[1] flex flex-wrap gap-x-3 gap-y-1">
                                                <span className="text-[11px] font-medium leading-none text-tint">
                                                    {repo.language}
                                                </span>
                                            </div>
                                        )}
                                    </motion.a>
                                </React.Fragment>
                            ))}
                        </motion.div>
                    )
                )}
            </div>
        </GlassCard>
    );
}
