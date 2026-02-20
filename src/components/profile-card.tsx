"use client";

import { useState, useEffect } from "react";
import { siteConfig } from "@/config/site";
import { GlassCard } from "@/components/glass-card";
import { AvatarCarousel } from "@/components/avatar-carousel";
import { Typewriter } from "@/components/typewriter";
import { MapPin } from "lucide-react";

function useLocalized() {
    const [result, setResult] = useState({
        hello: "Hi",
        iam: "I'm",
        langPrefix: "en",
    });

    useEffect(() => {
        setTimeout(() => {
            const lang = navigator.language;
            if (lang.startsWith("zh")) setResult({ hello: "你好", iam: "我是", langPrefix: "zh" });
            else if (lang.startsWith("ja")) setResult({ hello: "こんにちは", iam: "私は", langPrefix: "ja" });
            else if (lang.startsWith("ko")) setResult({ hello: "안녕하세요", iam: "저는", langPrefix: "ko" });
            else if (lang.startsWith("es")) setResult({ hello: "Hola", iam: "soy", langPrefix: "es" });
            else if (lang.startsWith("fr")) setResult({ hello: "Bonjour", iam: "je suis", langPrefix: "fr" });
            else if (lang.startsWith("de")) setResult({ hello: "Hallo", iam: "ich bin", langPrefix: "de" });
            else setResult({ hello: "Hi", iam: "I'm", langPrefix: "en" });
        }, 0);
    }, []);

    return result;
}

interface ProfileCardProps {
    avatarImages?: string[];
}

export function ProfileCard({ avatarImages }: ProfileCardProps) {
    const { name, title, description, aliases, location } = siteConfig.profile;
    const { hello, iam, langPrefix } = useLocalized();

    // Resolve description by browser language, fallback to "en", then first available
    const localizedDesc =
        description[langPrefix] ??
        description["en"] ??
        Object.values(description)[0] ??
        "";

    // Build avatar image paths
    const images =
        avatarImages && avatarImages.length > 0
            ? avatarImages.map((f) => `/avatar/${f}`)
            : [siteConfig.profile.avatar];

    return (
        <GlassCard className="flex flex-col items-center text-center gap-4 p-5 md:p-6 md:flex-row md:text-left md:items-start md:gap-5 h-full">
            {/* Avatar Carousel */}
            <AvatarCarousel images={images} alt={name} />

            {/* Info */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
                {/* Line 1: Hello 👋 */}
                <p className="text-2xl font-medium text-text-secondary animate-fade-in">
                    {hello}{" "}
                    <span className="inline-block animate-wave origin-[70%_70%]">👋</span>
                </p>
                {/* Line 2: I'm + Name */}
                <h1 className="text-4xl font-bold tracking-tight text-text-primary">
                    <span className="text-text-secondary font-medium">{iam}</span>{" "}
                    {aliases && aliases.length > 0 ? (
                        <Typewriter aliases={aliases} />
                    ) : (
                        name
                    )}
                </h1>
                <p className="text-xl font-medium text-text-secondary">{title}</p>
                {location && (
                    <p className="flex items-center justify-center gap-1.5 text-base text-text-tertiary md:justify-start">
                        <MapPin size={16} className="shrink-0" />
                        {location}
                    </p>
                )}
                <p className="mt-1 text-base leading-relaxed text-text-secondary">
                    {localizedDesc}
                </p>
            </div>
        </GlassCard>
    );
}
