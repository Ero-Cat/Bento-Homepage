"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type { GeoJSONSource, Map as MapboxMap } from "mapbox-gl";
import { GlassCard } from "@/components/glass-card";
import { siteConfig } from "@/config/site";
import { useDynamicLocation } from "@/hooks/use-dynamic-location";
import "mapbox-gl/dist/mapbox-gl.css";

type MapboxApi = typeof import("mapbox-gl")["default"];
type MapConfig = NonNullable<typeof siteConfig.map>;

function haversineKm(a: [number, number], b: [number, number]) {
    const R = 6371;
    const dLat = ((b[1] - a[1]) * Math.PI) / 180;
    const dLon = ((b[0] - a[0]) * Math.PI) / 180;
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a[1] * Math.PI) / 180) *
        Math.cos((b[1] * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

function generateArc(
    start: [number, number],
    end: [number, number],
    steps = 72
): [number, number][] {
    const coords: [number, number][] = [];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const len = Math.max(Math.sqrt(dx * dx + dy * dy), 0.0001);
    const maxOffset = Math.min(len * 0.25, 2.5);
    const nx = -dy / len;
    const ny = dx / len;

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lng = start[0] + dx * t;
        const lat = start[1] + dy * t;
        const arc = Math.sin(t * Math.PI) * maxOffset;
        coords.push([lng + nx * arc, lat + ny * arc]);
    }
    return coords;
}

function useIsDark() {
    const [dark, setDark] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const initialTimer = window.setTimeout(() => setDark(mq.matches), 0);
        const handler = (e: MediaQueryListEvent) => setDark(e.matches);
        mq.addEventListener("change", handler);
        return () => {
            window.clearTimeout(initialTimer);
            mq.removeEventListener("change", handler);
        };
    }, []);
    return dark;
}

export function MapCard() {
    const mapConfig = siteConfig.map;
    const cardRef = useRef<HTMLDivElement>(null);
    const [shouldLoadMap, setShouldLoadMap] = useState(false);

    useEffect(() => {
        if (!mapConfig || shouldLoadMap) return;
        const node = cardRef.current;
        if (!node || !("IntersectionObserver" in window)) {
            const timer = window.setTimeout(() => setShouldLoadMap(true), 0);
            return () => window.clearTimeout(timer);
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry?.isIntersecting) return;
                setShouldLoadMap(true);
                observer.disconnect();
            },
            { root: null, rootMargin: "420px 0px" },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [mapConfig, shouldLoadMap]);

    if (!mapConfig) return null;

    return (
        <GlassCard
            variant="media"
            className="map-card relative !p-0 h-full"
            contentClassName="glass-media-mask relative h-full"
            innerClip
        >
            <div ref={cardRef} className="relative h-full">
                <div className="map-header">
                    <span className="text-sm text-text-tertiary">
                        {mapConfig.markers.length} 个城市
                    </span>
                </div>
                {shouldLoadMap ? (
                    <InteractiveMap mapConfig={mapConfig} />
                ) : (
                    <div className="map-placeholder" aria-hidden="true" />
                )}
            </div>
        </GlassCard>
    );
}

function InteractiveMap({ mapConfig }: { mapConfig: MapConfig }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapboxMap | null>(null);
    const mapboxRef = useRef<MapboxApi | null>(null);
    const isDark = useIsDark();
    const visitorLocation = useDynamicLocation();

    const hefeiCoords: [number, number] = useMemo(() => {
        const hefeiMarker = mapConfig.markers.find((m) => m.name === "合肥");
        return hefeiMarker ? hefeiMarker.coordinates : [117.2272, 31.8206];
    }, [mapConfig.markers]);

    const visitorCoords: [number, number] | null = useMemo(() => {
        return visitorLocation ? [visitorLocation.lon, visitorLocation.lat] : null;
    }, [visitorLocation]);

    const distanceKm = useMemo(() => {
        return visitorCoords ? haversineKm(hefeiCoords, visitorCoords) : null;
    }, [hefeiCoords, visitorCoords]);

    const drawArc = useCallback(
        (map: MapboxMap, mapboxgl: MapboxApi) => {
            if (!visitorCoords) return;

            containerRef.current
                ?.querySelectorAll(".map-dynamic-marker")
                .forEach((marker) => marker.remove());

            const el = document.createElement("div");
            el.className = "map-visitor-marker map-dynamic-marker";
            el.setAttribute("aria-label", visitorLocation!.city);

            new mapboxgl.Marker({ element: el })
                .setLngLat(visitorCoords)
                .setPopup(
                    new mapboxgl.Popup({
                        offset: 20,
                        closeButton: false,
                        className: "map-popup",
                    }).setHTML(
                        `<span class="map-popup-content">${visitorLocation!.city}（你的位置）</span>`
                    )
                )
                .addTo(map);

            const arcCoords = generateArc(hefeiCoords, visitorCoords);
            const midPoint = arcCoords[Math.floor(arcCoords.length / 2)];

            if (distanceKm) {
                const lang = navigator.language || "en";
                const labelText = lang.startsWith("zh") ? "与您距离我" : "Distance from me:";
                const labelEl = document.createElement("div");
                labelEl.className = "map-arc-distance map-dynamic-marker";
                labelEl.innerHTML = `<span class="opacity-80 mr-1 text-[11px] font-normal tracking-wide">${labelText}</span><span class="font-bold text-[12px]">${distanceKm}</span><span class="text-[10px] opacity-80 ml-[2px]">km</span>`;
                new mapboxgl.Marker({ element: labelEl, anchor: "bottom", offset: [0, -4] })
                    .setLngLat(midPoint as [number, number])
                    .addTo(map);
            }

            const lineColor = isDark
                ? "rgba(251, 113, 133, 0.7)"
                : "rgba(190, 24, 93, 0.6)";

            if (map.getSource("visitor-arc")) {
                (map.getSource("visitor-arc") as GeoJSONSource).setData({
                    type: "Feature",
                    properties: {},
                    geometry: { type: "LineString", coordinates: arcCoords },
                });
                map.setPaintProperty("visitor-arc-line", "line-color", lineColor);
                return;
            }

            map.addSource("visitor-arc", {
                type: "geojson",
                data: {
                    type: "Feature",
                    properties: {},
                    geometry: { type: "LineString", coordinates: arcCoords },
                },
            });

            map.addLayer({
                id: "visitor-arc-line",
                type: "line",
                source: "visitor-arc",
                paint: {
                    "line-color": lineColor,
                    "line-width": 2,
                    "line-dasharray": [2, 2],
                },
            });
        },
        [visitorCoords, visitorLocation, hefeiCoords, distanceKm, isDark],
    );

    useEffect(() => {
        if (!containerRef.current) return;
        let cancelled = false;
        let map: MapboxMap | null = null;

        async function initMap() {
            const mapboxgl = (await import("mapbox-gl")).default;
            if (cancelled || !containerRef.current) return;

            mapboxRef.current = mapboxgl;
            mapboxgl.accessToken = mapConfig.accessToken;

            map = new mapboxgl.Map({
                container: containerRef.current,
                style: "mapbox://styles/mapbox/standard",
                center: mapConfig.center,
                zoom: mapConfig.zoom,
                attributionControl: false,
                logoPosition: "bottom-left",
                pitchWithRotate: false,
                dragRotate: false,
                interactive: true,
            });
            mapRef.current = map;

            map.on("style.load", () => {
                if (!map) return;
                map.setConfigProperty("basemap", "lightPreset", isDark ? "night" : "day");

                const lang = navigator.language || "en";
                const mapLang = lang.startsWith("zh-TW") || lang.startsWith("zh-Hant")
                    ? "zh-Hant"
                    : lang.startsWith("zh")
                        ? "zh-Hans"
                        : lang.split("-")[0];
                map.setConfigProperty("basemap", "language", mapLang);

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
                                `<span class="map-popup-content">${marker.emoji ?? ""} ${marker.name}</span>`
                            )
                        )
                        .addTo(map);
                }

                drawArc(map, mapboxgl);
            });
        }

        initMap();

        return () => {
            cancelled = true;
            map?.remove();
            mapRef.current = null;
        };
    }, [mapConfig, isDark, drawArc]);

    useEffect(() => {
        const map = mapRef.current;
        const mapboxgl = mapboxRef.current;
        if (!map || !mapboxgl || !visitorLocation) return;
        if (map.isStyleLoaded()) {
            drawArc(map, mapboxgl);
        }
    }, [visitorLocation, drawArc]);

    return <div ref={containerRef} className="map-container" />;
}
