"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/glass-card";
import { siteConfig } from "@/config/site";

/* ============================================================
   GitHub Contribution Heatmap Card
   Data: github-contributions-api.jogruber.de (no token needed)
   ============================================================ */

interface ContributionDay {
    date: string;
    count: number;
    level: number; // 0-4
}

interface ContributionData {
    total: { lastYear: number };
    contributions: ContributionDay[];
}

interface Point {
    x: number;
    y: number;
}

const CELL = 11;
const GAP = 3;
const ROWS = 7;

/* Tint color opacity levels matching GitHub's 5-step scale */
const LEVEL_OPACITY = [0.05, 0.25, 0.5, 0.75, 1.0];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function GitHubHeatmapCard() {
    const username = siteConfig.github?.username;
    const [data, setData] = useState<ContributionData | null>(null);
    // Initialize loading based on whether username exists to avoid immediate state change
    const [loading, setLoading] = useState(!!username);
    const [tooltip, setTooltip] = useState<{
        x: number;
        y: number;
        date: string;
        count: number;
    } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!username) return;

        fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`)
            .then((r) => r.json())
            .then((d: ContributionData) => {
                setData(d);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [username]);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const snakeLayerRef = useRef<SVGGElement>(null);

    // =========== Snake Animation Logic ===========
    useEffect(() => {
        if (!data || !snakeLayerRef.current) return;

        const width = Math.ceil(data.contributions.length / ROWS);
        const height = ROWS;
        const initialGrid = Array.from({ length: width }, () => Array(height).fill(0));
        data.contributions.forEach((day, idx) => {
            const col = Math.floor(idx / ROWS);
            const row = idx % ROWS;
            initialGrid[col][row] = day.level;
        });

        let currentGrid = initialGrid.map((row) => [...row]);
        // Snake always starts at top-left
        let snake: Point[] = [{ x: 0, y: 0 }];
        let path: Point[] = [];
        let isRunning = true;

        const labelOffset = 28;
        const headerOffset = 16;

        function findPath(start: Point): Point[] | null {
            let maxLevel = 0;
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    if (currentGrid[x][y] > maxLevel) maxLevel = currentGrid[x][y];
                }
            }
            if (maxLevel === 0) return null;

            const queue: { pos: Point; p: Point[] }[] = [{ pos: start, p: [] }];
            const visited = new Set<string>();
            visited.add(`${start.x},${start.y}`);

            const bodySet = new Set<string>();
            for (let i = 0; i < snake.length - 1; i++) {
                bodySet.add(`${snake[i].x},${snake[i].y}`);
            }

            let firstFoodPath: Point[] | null = null;
            const dirs = [
                [0, -1],
                [1, 0],
                [0, 1],
                [-1, 0],
            ];

            while (queue.length > 0) {
                const { pos, p } = queue.shift()!;

                if (p.length > 0 && currentGrid[pos.x][pos.y] > 0) {
                    if (!firstFoodPath) firstFoodPath = p;
                    if (currentGrid[pos.x][pos.y] === maxLevel) return p;
                }

                for (const [dx, dy] of dirs) {
                    const nx = pos.x + dx;
                    const ny = pos.y + dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const key = `${nx},${ny}`;
                        if (!visited.has(key) && !bodySet.has(key)) {
                            visited.add(key);
                            queue.push({ pos: { x: nx, y: ny }, p: [...p, { x: nx, y: ny }] });
                        }
                    }
                }
            }
            return firstFoodPath;
        }

        const resetGame = () => {
            snake = [{ x: 0, y: 0 }];
            path = [];
            currentGrid = initialGrid.map((row) => [...row]);
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    const cell = document.getElementById(`cell-${x}-${y}`);
                    if (cell) cell.setAttribute("fill", `rgba(var(--tint-rgb), ${LEVEL_OPACITY[initialGrid[x][y]]})`);
                }
            }
        };

        const renderSnake = () => {
            const layer = snakeLayerRef.current;
            if (!layer) return;

            let html = "";
            // draw connections
            for (let i = 0; i < snake.length - 1; i++) {
                const p1 = snake[i];
                const p2 = snake[i + 1];
                const minX = Math.min(p1.x, p2.x);
                const minY = Math.min(p1.y, p2.y);
                const isHorizontal = p1.y === p2.y;
                html += `<rect x="${labelOffset + minX * (CELL + GAP) + (isHorizontal ? CELL : 0)}" y="${headerOffset + minY * (CELL + GAP) + (isHorizontal ? 0 : CELL)
                    }" width="${isHorizontal ? GAP : CELL}" height="${isHorizontal ? CELL : GAP
                    }" fill="rgb(var(--tint-rgb))" />`;
            }
            // draw body segments
            for (let i = 0; i < snake.length; i++) {
                const p = snake[i];
                html += `<rect x="${labelOffset + p.x * (CELL + GAP)}" y="${headerOffset + p.y * (CELL + GAP)
                    }" width="${CELL}" height="${CELL}" rx="2" ry="2" fill="rgb(var(--tint-rgb))" />`;

                // head eyes
                if (i === 0) {
                    const next = snake.length > 1 ? snake[1] : null;
                    let dx = 1, dy = 0;
                    if (next) {
                        dx = p.x - next.x;
                        dy = p.y - next.y;
                    }
                    const hx = labelOffset + p.x * (CELL + GAP);
                    const hy = headerOffset + p.y * (CELL + GAP);
                    let e1x = 0, e1y = 0, e2x = 0, e2y = 0;
                    if (dx === 1) { e1x = hx + 7; e1y = hy + 3; e2x = hx + 7; e2y = hy + 7; }
                    else if (dx === -1) { e1x = hx + 3; e1y = hy + 3; e2x = hx + 3; e2y = hy + 7; }
                    else if (dy === 1) { e1x = hx + 3; e1y = hy + 7; e2x = hx + 7; e2y = hy + 7; }
                    else { e1x = hx + 3; e1y = hy + 3; e2x = hx + 7; e2y = hy + 3; }

                    html += `<rect x="${e1x}" y="${e1y}" width="2" height="2" fill="#fff" />`;
                    html += `<rect x="${e2x}" y="${e2y}" width="2" height="2" fill="#fff" />`;
                }
            }
            layer.innerHTML = html;
        };

        const tick = () => {
            if (!isRunning) return;

            if (path.length === 0) {
                const newPath = findPath(snake[0]);
                if (newPath) {
                    path = newPath;
                } else {
                    // Check if anything is left to eat
                    let hasFood = false;
                    for (let x = 0; x < width; x++) {
                        for (let y = 0; y < height; y++) {
                            if (currentGrid[x][y] > 0) hasFood = true;
                        }
                    }
                    if (!hasFood) {
                        isRunning = false;
                        setTimeout(() => { resetGame(); isRunning = true; }, 3000);
                        return;
                    }

                    // Totally stuck? Wander
                    const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
                    const head = snake[0];
                    const bodySet = new Set(snake.map(s => `${s.x},${s.y}`));
                    let moved = false;
                    for (const [dx, dy] of dirs) {
                        const nx = head.x + dx;
                        const ny = head.y + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height && !bodySet.has(`${nx},${ny}`)) {
                            path = [{ x: nx, y: ny }];
                            moved = true;
                            break;
                        }
                    }
                    if (!moved) {
                        // Dead end
                        isRunning = false;
                        setTimeout(() => { resetGame(); isRunning = true; }, 3000);
                        return;
                    }
                }
            }

            const nextStep = path.shift();
            if (nextStep) {
                let ate = false;
                if (currentGrid[nextStep.x][nextStep.y] > 0) {
                    ate = true;
                    currentGrid[nextStep.x][nextStep.y] = 0;
                    const cell = document.getElementById(`cell-${nextStep.x}-${nextStep.y}`);
                    if (cell) cell.setAttribute("fill", `rgba(var(--tint-rgb), ${LEVEL_OPACITY[0]})`);
                }
                snake.unshift(nextStep);
                if (!ate) snake.pop();
            }
            renderSnake();
        };

        const intervalId = setInterval(tick, 60);
        return () => {
            clearInterval(intervalId);
            isRunning = false;
        };
    }, [data]);

    // =============================================

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<SVGSVGElement>) => {
            const svg = svgRef.current;
            const wrapper = wrapperRef.current;
            if (!svg || !wrapper || !data) return;

            /* Convert screen coords → SVG viewBox coords via CTM */
            const ctm = svg.getScreenCTM();
            if (!ctm) return;
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgPt = pt.matrixTransform(ctm.inverse());

            const labelOffset = 28;
            const headerOffset = 16;
            const col = Math.floor((svgPt.x - labelOffset) / (CELL + GAP));
            const row = Math.floor((svgPt.y - headerOffset) / (CELL + GAP));

            if (col < 0 || row < 0 || row >= ROWS) {
                setTooltip(null);
                return;
            }

            const idx = col * ROWS + row;
            if (idx >= 0 && idx < data.contributions.length) {
                const day = data.contributions[idx];
                /* Tooltip position uses DOM-pixel coords relative to wrapper */
                const wrapperRect = wrapper.getBoundingClientRect();
                setTooltip({
                    x: e.clientX - wrapperRect.left,
                    y: e.clientY - wrapperRect.top - 40,
                    date: day.date,
                    count: day.count,
                });
            } else {
                setTooltip(null);
            }
        },
        [data]
    );

    if (!username) return null;

    /* Calculate grid dimensions (viewBox space, not pixel space) */
    const weeks = data ? Math.ceil(data.contributions.length / ROWS) : 53;
    const labelOffset = 28;
    const headerOffset = 16;
    const svgWidth = labelOffset + weeks * (CELL + GAP);
    const svgHeight = headerOffset + ROWS * (CELL + GAP);

    /* Get month labels for the x-axis */
    const monthLabels: { label: string; x: number }[] = [];
    if (data) {
        let lastMonth = -1;
        for (let w = 0; w < weeks; w++) {
            const idx = w * ROWS;
            if (idx < data.contributions.length) {
                const month = new Date(data.contributions[idx].date).getMonth();
                if (month !== lastMonth) {
                    monthLabels.push({
                        label: MONTHS[month],
                        x: labelOffset + w * (CELL + GAP),
                    });
                    lastMonth = month;
                }
            }
        }
    }

    return (
        <GlassCard className="flex flex-col gap-3 p-5 h-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">GitHub</h3>
                {data && (
                    <span className="text-sm text-text-tertiary">
                        过去一年 <strong className="text-text-primary">{data.total.lastYear}</strong> 次贡献
                    </span>
                )}
            </div>

            {/* Heatmap Grid — responsive via viewBox */}
            <div ref={wrapperRef} className="relative w-full">
                {loading ? (
                    /* Skeleton — fills card width */
                    <div className="flex justify-between w-full">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-[3px]">
                                {Array.from({ length: 7 }).map((_, j) => (
                                    <div
                                        key={j}
                                        className="rounded-sm animate-pulse"
                                        style={{
                                            width: CELL,
                                            height: CELL,
                                            backgroundColor: "var(--glass-border)",
                                        }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                ) : data ? (
                    <svg
                        ref={svgRef}
                        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        width="100%"
                        preserveAspectRatio="xMidYMid meet"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setTooltip(null)}
                        className="select-none w-full"
                    >
                        {/* Month labels */}
                        {monthLabels.map((m, i) => (
                            <text
                                key={i}
                                x={m.x}
                                y={11}
                                className="fill-text-tertiary"
                                fontSize={10}
                                fontFamily="inherit"
                            >
                                {m.label}
                            </text>
                        ))}

                        {/* Day labels */}
                        {DAYS.map((d, i) => (
                            d && (
                                <text
                                    key={i}
                                    x={0}
                                    y={headerOffset + i * (CELL + GAP) + CELL - 1}
                                    className="fill-text-tertiary"
                                    fontSize={9}
                                    fontFamily="inherit"
                                >
                                    {d}
                                </text>
                            )
                        ))}

                        {/* Contribution cells */}
                        {data.contributions.map((day, idx) => {
                            const col = Math.floor(idx / ROWS);
                            const row = idx % ROWS;
                            return (
                                <rect
                                    id={`cell-${col}-${row}`}
                                    key={day.date}
                                    x={labelOffset + col * (CELL + GAP)}
                                    y={headerOffset + row * (CELL + GAP)}
                                    width={CELL}
                                    height={CELL}
                                    rx={2}
                                    ry={2}
                                    fill={`rgba(var(--tint-rgb), ${LEVEL_OPACITY[day.level]})`}
                                    className="transition-opacity duration-150"
                                />
                            );
                        })}

                        {/* Snake Animation Layer */}
                        <g ref={snakeLayerRef} className="pointer-events-none" />
                    </svg>
                ) : (
                    <p className="text-sm text-text-tertiary">无法加载贡献数据</p>
                )}

                {/* Tooltip */}
                {tooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute pointer-events-none px-2.5 py-1.5 rounded-lg text-xs font-medium z-50"
                        style={{
                            left: tooltip.x,
                            top: tooltip.y,
                            background: "var(--glass-bg)",
                            backdropFilter: "blur(12px)",
                            border: "1px solid var(--glass-border)",
                            color: "var(--text-primary)",
                            transform: "translateX(-50%)",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {tooltip.count > 0
                            ? `${formatDate(tooltip.date)}：${tooltip.count} 次贡献`
                            : `${formatDate(tooltip.date)}：无贡献`}
                    </motion.div>
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1.5 text-xs text-text-tertiary self-end">
                <span>少</span>
                {LEVEL_OPACITY.map((op, i) => (
                    <div
                        key={i}
                        className="rounded-sm"
                        style={{
                            width: CELL,
                            height: CELL,
                            backgroundColor: `rgba(var(--tint-rgb), ${op})`,
                        }}
                    />
                ))}
                <span>多</span>
            </div>
        </GlassCard>
    );
}
