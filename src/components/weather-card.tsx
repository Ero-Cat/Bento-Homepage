"use client";

import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import { GlassCard } from "@/components/glass-card";
import { useDynamicLocation } from "@/hooks/use-dynamic-location";
import { motion } from "framer-motion";
import {
    Sun,
    CloudSun,
    Cloud,
    CloudFog,
    CloudRain,
    CloudSnow,
    CloudLightning,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherData {
    temp: number;
    condition: string;
    code: number;
    high: number;
    low: number;
}

const RAIN_DROPS = Array.from({ length: 20 }).map(() => ({
    left: `${Math.random() * 100}%`,
    targetLeft: `${Math.random() * 100 - 10}%`,
    duration: 0.5 + Math.random() * 0.4,
    delay: Math.random()
}));

const RainEffect = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden [border-radius:inherit]">
        {RAIN_DROPS.map((drop, i) => (
            <motion.div
                key={i}
                className="absolute w-[2px] h-8 bg-blue-500/20 dark:bg-blue-400/20"
                initial={{ top: -40, left: drop.left }}
                animate={{ top: "120%", left: drop.targetLeft }}
                transition={{
                    duration: drop.duration,
                    repeat: Infinity,
                    ease: "linear",
                    delay: drop.delay
                }}
            />
        ))}
    </div>
);

const SNOW_FLAKES = Array.from({ length: 30 }).map(() => ({
    left: `${Math.random() * 100}%`,
    x: Math.random() * 60 - 30,
    duration: 2.5 + Math.random() * 3,
    delay: Math.random() * 2
}));

const SnowEffect = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden [border-radius:inherit]">
        {SNOW_FLAKES.map((flake, i) => (
            <motion.div
                key={i}
                className="absolute w-2 h-2 bg-slate-400/60 dark:bg-white/40 rounded-full blur-[1px]"
                initial={{ top: -10, left: flake.left }}
                animate={{
                    top: "120%",
                    x: [0, flake.x, 0]
                }}
                transition={{
                    duration: flake.duration,
                    repeat: Infinity,
                    ease: "linear",
                    delay: flake.delay
                }}
            />
        ))}
    </div>
);

const CloudEffect = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden [border-radius:inherit]">
        <motion.div
            className="absolute top-10 opacity-30 text-foreground/20"
            initial={{ left: "-50%" }}
            animate={{ left: "120%" }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        >
            <Cloud size={64} />
        </motion.div>
        <motion.div
            className="absolute top-24 opacity-20 text-foreground/20 z-0"
            initial={{ left: "-40%" }}
            animate={{ left: "120%" }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 8 }}
        >
            <Cloud size={48} />
        </motion.div>
    </div>
);

const ThunderEffect = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden [border-radius:inherit]">
        <RainEffect />
        <motion.div
            className="absolute inset-0 bg-white/20 dark:bg-white/10 mix-blend-overlay"
            animate={{ opacity: [0, 0.8, 0, 0, 0, 0.5, 0] }}
            transition={{
                duration: 5,
                repeat: Infinity,
                times: [0, 0.02, 0.05, 0.5, 0.52, 0.55, 1]
            }}
        />
    </div>
);

const SunEffect = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden [border-radius:inherit] flex justify-end">
        <motion.div
            className="absolute -top-10 -right-10 text-amber-500/20 dark:text-amber-500/10 blur-[4px]"
            animate={{ rotate: 360, scale: [1, 1.1, 1] }}
            transition={{
                rotate: { duration: 40, repeat: Infinity, ease: "linear" },
                scale: { duration: 6, repeat: Infinity, ease: "easeInOut" }
            }}
        >
            <Sun size={180} strokeWidth={1} />
        </motion.div>
    </div>
);

function WeatherAnimations({ code }: { code: number }) {
    if (code === 0 || code === 1) return <SunEffect />;
    if (code === 2 || code === 3 || code === 45 || code === 48) return <CloudEffect />;
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return <RainEffect />;
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return <SnowEffect />;
    if (code >= 95) return <ThunderEffect />;
    return null;
}

export function WeatherCard() {
    const [data, setData] = useState<WeatherData | null>(null);
    const [error, setError] = useState(false);
    const [effectsEnabled, setEffectsEnabled] = useState(true);
    const location = useDynamicLocation();

    useEffect(() => {
        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const coarseQuery = window.matchMedia("(pointer: coarse)");
        const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
        const update = () => {
            setEffectsEnabled(!motionQuery.matches && !coarseQuery.matches && !nav.connection?.saveData);
        };
        update();
        motionQuery.addEventListener("change", update);
        coarseQuery.addEventListener("change", update);
        return () => {
            motionQuery.removeEventListener("change", update);
            coarseQuery.removeEventListener("change", update);
        };
    }, []);

    useEffect(() => {
        // Only fetch weather if location is loaded
        if (!location) return;

        async function fetchWeather() {
            try {
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${location!.lat}&longitude=${location!.lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
                const res = await fetch(url);
                if (!res.ok) throw new Error("Failed to fetch weather");

                const json = await res.json();

                setData({
                    temp: Math.round(json.current.temperature_2m),
                    code: json.current.weather_code,
                    high: Math.round(json.daily.temperature_2m_max[0]),
                    low: Math.round(json.daily.temperature_2m_min[0]),
                    condition: getWeatherCondition(json.current.weather_code),
                });
                setError(false);
            } catch (err) {
                console.error(err);
                setError(true);
            }
        }

        fetchWeather();
    }, [location]);

    const { gradient } = getWeatherStyles(data?.code ?? 0);
    const WeatherIcon = data ? getWeatherStyles(data.code).icon : Cloud;

    // Optional: date string for Apple-like header
    const dateStr = new Date().toLocaleDateString('zh-CN', { weekday: 'short', month: 'short', day: 'numeric' });

    return (
        <GlassCard
            variant="immersive"
            className="relative h-full w-full p-0 overflow-hidden"
        >
            {/* Gradient background layer — fills entire card, clipped by glass-card overflow:hidden */}
            <div
                className={cn(
                    "absolute inset-0 transition-all duration-700",
                    data ? gradient : "bg-slate-800/60"
                )}
                aria-hidden="true"
            />

            {/* Dynamic Weather Animations */}
            {data && effectsEnabled && <WeatherAnimations code={data.code} />}

            {/* Content — own flex layout, own padding, on top of background */}
            <div className="relative z-10 flex flex-col justify-between h-full p-5 text-slate-950 dark:text-white">
                {/* Top Section: City name (left) + Icon (right) */}
                <div className="flex justify-between items-start w-full">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold tracking-tight drop-shadow-sm flex items-center gap-1">
                            {location?.city || (siteConfig.weather?.city || "合肥")}
                        </h2>
                        <span className="text-xs font-medium opacity-90 drop-shadow-sm mt-0.5">
                            {dateStr}
                        </span>
                    </div>
                    {data && <WeatherIcon className="drop-shadow-md opacity-90" size={28} />}
                </div>

                {/* Bottom Section: Temperature & Details */}
                <div className="flex flex-col items-start w-full">
                    {data ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="flex flex-col w-full"
                        >
                            <div className="text-6xl font-semibold tracking-tighter drop-shadow-md -ml-1">
                                {data.temp}&deg;
                            </div>
                            <div className="flex justify-between items-end w-full mt-2">
                                <span className="text-[15px] font-medium drop-shadow-sm leading-none">
                                    {data.condition}
                                </span>
                                <span className="text-xs font-medium opacity-90 drop-shadow-sm leading-none pb-0.5">
                                    最高 {data.high}&deg; 最低 {data.low}&deg;
                                </span>
                            </div>
                        </motion.div>
                    ) : error ? (
                        <div className="text-sm opacity-80">获取天气失败</div>
                    ) : (
                        <div className="flex w-full items-center justify-center mb-4">
                            <Loader2 className="h-6 w-6 animate-spin opacity-60" />
                        </div>
                    )}
                </div>
            </div>
        </GlassCard>
    );
}

// Map WMO codes to descriptions
function getWeatherCondition(code: number): string {
    if (code === 0) return "晴天";
    if (code === 1) return "晴间多云";
    if (code === 2) return "部分多云";
    if (code === 3) return "阴天";
    if (code === 45 || code === 48) return "雾";
    if (code >= 51 && code <= 67) return "雨";
    if (code >= 71 && code <= 77) return "雪";
    if (code >= 80 && code <= 82) return "阵雨";
    if (code >= 85 && code <= 86) return "阵雪";
    if (code >= 95) return "雷暴";
    return "未知";
}

// Map WMO codes to Apple Weather-like gradients and icons
function getWeatherStyles(code: number) {
    let styles = {
        gradient: "bg-[linear-gradient(155deg,#cde8f6,#9ec8e8)] dark:bg-[linear-gradient(155deg,#1a2e3f,#0d1c2b)]",
        icon: Cloud,
    };

    if (code === 0 || code === 1) { // Clear — warm amber-gold (Apple Weather sunny)
        styles = {
            gradient: "bg-[linear-gradient(155deg,#ffd27f,#ff9f2f)] dark:bg-[linear-gradient(155deg,#1b3a6e,#0d2147)]",
            icon: Sun,
        };
    } else if (code === 2) { // Partly Cloudy — cool sky blue
        styles = {
            gradient: "bg-[linear-gradient(155deg,#c8e8f8,#93c9f0)] dark:bg-[linear-gradient(155deg,#1e3048,#111e30)]",
            icon: CloudSun,
        };
    } else if (code === 3) { // Cloudy — muted blue-gray
        styles = {
            gradient: "bg-[linear-gradient(155deg,#d4e4ef,#aec8da)] dark:bg-[linear-gradient(155deg,#1c2a38,#0f1820)]",
            icon: Cloud,
        };
    } else if (code === 45 || code === 48) { // Fog — soft pearl gray
        styles = {
            gradient: "bg-[linear-gradient(155deg,#dde8ed,#becdd8)] dark:bg-[linear-gradient(155deg,#1e2c36,#111c24)]",
            icon: CloudFog,
        };
    } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) { // Rain — deep teal-blue
        styles = {
            gradient: "bg-[linear-gradient(155deg,#8fb8d4,#5b8fae)] dark:bg-[linear-gradient(155deg,#0f2030,#060e18)]",
            icon: CloudRain,
        };
    } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) { // Snow — icy lavender-white
        styles = {
            gradient: "bg-[linear-gradient(155deg,#dfe9f8,#b8ceef)] dark:bg-[linear-gradient(155deg,#1a2848,#0e1830)]",
            icon: CloudSnow,
        };
    } else if (code >= 95) { // Thunderstorm — dramatic indigo-slate
        styles = {
            gradient: "bg-[linear-gradient(155deg,#7a8ea0,#4a6070)] dark:bg-[linear-gradient(155deg,#0c1520,#050810)]",
            icon: CloudLightning,
        };
    }

    return styles;
}
