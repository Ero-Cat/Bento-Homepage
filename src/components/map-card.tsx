"use client";

import { useRef, useEffect, useState } from "react";
import { GlassCard } from "@/components/glass-card";
import { siteConfig } from "@/config/site";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

/* ============================================================
   Map Card — Interactive Mapbox GL map showing visited cities
   Style: Mapbox Standard (auto dark/light + i18n)
   Reference: ericwu.me
   ============================================================ */

/** Detect system dark mode preference */
function useIsDark() {
    const [dark, setDark] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        // Defer initial set to avoid "synchronous setState" warning
        setTimeout(() => setDark(mq.matches), 0);

        const handler = (e: MediaQueryListEvent) => setDark(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return dark;
}

export function MapCard() {
    const mapConfig = siteConfig.map;
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const isDark = useIsDark();

    /* Initialize map */
    useEffect(() => {
        if (!mapConfig || !containerRef.current) return;

        mapboxgl.accessToken = mapConfig.accessToken;

        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: "mapbox://styles/mapbox/standard",
            center: mapConfig.center,
            zoom: mapConfig.zoom,
            attributionControl: false,
            logoPosition: "bottom-left",
            pitchWithRotate: false,
            dragRotate: false,
        });

        /* Hide Mapbox logo via DOM after init */
        const logoEl = containerRef.current.querySelector(".mapboxgl-ctrl-logo");
        if (logoEl) (logoEl as HTMLElement).style.display = "none";

        /* Configure Standard style: theme + language */
        map.on("style.load", () => {
            // Set light/dark theme via Standard style config
            map.setConfigProperty("basemap", "lightPreset",
                isDark ? "night" : "day"
            );

            // Auto-detect browser language for map labels
            // Mapbox Standard uses codes like "zh-Hans", "zh-Hant", "ja", "ko", "en"
            // navigator.language returns "zh-CN", "zh-TW", "ja", "en-US" etc.
            const lang = navigator.language || "en";
            const mapLang = lang.startsWith("zh-TW") || lang.startsWith("zh-Hant")
                ? "zh-Hant"
                : lang.startsWith("zh")
                    ? "zh-Hans"
                    : lang.split("-")[0]; // "en-US" → "en", "ja" → "ja"
            map.setConfigProperty("basemap", "language", mapLang);

            // Add markers
            for (const marker of mapConfig.markers) {
                const el = document.createElement("div");
                el.className = "map-marker";
                el.setAttribute("aria-label", marker.name);

                new mapboxgl.Marker({ element: el })
                    .setLngLat(marker.coordinates)
                    .setPopup(
                        new mapboxgl.Popup({
                            offset: 20,
                            closeButton: false,
                            className: "map-popup",
                        }).setHTML(
                            `<span class="map-popup-content">${marker.emoji ?? "📍"} ${marker.name}</span>`
                        )
                    )
                    .addTo(map);
            }
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [mapConfig, isDark]);

    if (!mapConfig) return null;

    return (
        <GlassCard className="map-card relative p-0 overflow-hidden">
            {/* Floating header overlay */}
            <div className="map-header">
                <span className="text-sm text-text-tertiary">
                    {mapConfig.markers.length} 个城市
                </span>
            </div>

            {/* Map container */}
            <div ref={containerRef} className="map-container" />
        </GlassCard>
    );
}
