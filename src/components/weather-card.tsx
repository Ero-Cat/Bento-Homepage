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
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
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
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
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
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
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
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
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
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl flex justify-end">
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
    const location = useDynamicLocation();

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
            className={cn(
                "relative h-full w-full flex flex-col justify-between p-5 transition-all duration-700 overflow-hidden",
                data ? gradient : "bg-card/50",
                "text-slate-800 dark:text-white"
            )}
        >
            {/* Dynamic Weather Animations */}
            {data && <WeatherAnimations code={data.code} />}

            {/* Top Section: City and Icon */}
            <div className="z-10 flex justify-between items-start w-full">
                <div className="flex flex-col">
                    <h2 className="text-xl font-bold tracking-tight drop-shadow-sm flex items-center gap-1">
                        {location?.city || (siteConfig.weather?.city || "合肥")}
                    </h2>
                    <span className="text-xs font-medium opacity-80 drop-shadow-sm mt-0.5">
                        {dateStr}
                    </span>
                </div>
                {data && <WeatherIcon className="drop-shadow-md opacity-90" size={28} />}
            </div>

            {/* Bottom Section: Temperature & Details */}
            <div className="z-10 flex flex-col items-start w-full mt-auto">
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
                            <span className="text-xs font-medium opacity-80 drop-shadow-sm leading-none pb-0.5">
                                最高 {data.high}&deg; 最低 {data.low}&deg;
                            </span>
                        </div>
                    </motion.div>
                ) : error ? (
                    <div className="text-sm opacity-70">获取天气失败</div>
                ) : (
                    <div className="flex w-full items-center justify-center mb-4">
                        <Loader2 className="h-6 w-6 animate-spin opacity-50" />
                    </div>
                )}
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
        gradient: "bg-[linear-gradient(135deg,#e0f7fa,#b3e5fc)] dark:bg-[linear-gradient(135deg,#2c3e50,#1a2530)]",
        icon: Cloud,
    };

    if (code === 0 || code === 1) { // Clear
        styles = {
            gradient: "bg-[linear-gradient(135deg,#ffecb3,#ffe082)] dark:bg-[linear-gradient(135deg,#1e3c72,#2a5298)]",
            icon: Sun,
        };
    } else if (code === 2) { // Partly Cloudy
        styles = {
            gradient: "bg-[linear-gradient(135deg,#e0f7fa,#b3e5fc)] dark:bg-[linear-gradient(135deg,#2c3e50,#1a2530)]",
            icon: CloudSun,
        };
    } else if (code === 3) { // Cloudy
        styles = {
            gradient: "bg-[linear-gradient(135deg,#e0f7fa,#b3e5fc)] dark:bg-[linear-gradient(135deg,#2c3e50,#1a2530)]",
            icon: Cloud,
        };
    } else if (code === 45 || code === 48) { // Fog
        styles = {
            gradient: "bg-[linear-gradient(135deg,#e0f7fa,#b3e5fc)] dark:bg-[linear-gradient(135deg,#2c3e50,#1a2530)]",
            icon: CloudFog,
        };
    } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) { // Rain
        styles = {
            gradient: "bg-[linear-gradient(135deg,#cfd8dc,#b0bec5)] dark:bg-[linear-gradient(135deg,#1a2a3a,#0d1520)]",
            icon: CloudRain,
        };
    } else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) { // Snow
        styles = {
            gradient: "bg-[linear-gradient(135deg,#e8eaf6,#c5cae9)] dark:bg-[linear-gradient(135deg,#243949,#141e30)]",
            icon: CloudSnow,
        };
    } else if (code >= 95) { // Thunderstorm
        styles = {
            gradient: "bg-[linear-gradient(135deg,#90a4ae,#78909c)] dark:bg-[linear-gradient(135deg,#101a24,#050a10)]",
            icon: CloudLightning,
        };
    }

    return styles;
}
