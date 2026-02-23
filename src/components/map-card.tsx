"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { GlassCard } from "@/components/glass-card";
import { siteConfig } from "@/config/site";
import { useDynamicLocation } from "@/hooks/use-dynamic-location";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

/* ============================================================
   Map Card — Interactive Mapbox GL map showing visited cities
   + IP geolocation arc & distance badge
   Style: Mapbox Standard (auto dark/light + i18n)
   ============================================================ */

// ── Helpers ──────────────────────────────────────────────────

/** Haversine distance in km */
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

/**
 * Generate a curved arc between two [lng,lat] points.
 * Uses sine-wave offset along the perpendicular (normal) direction
 * to simulate a 3D "arched" appearance on a 2D map.
 */
function generateArc(
    start: [number, number],
    end: [number, number],
    steps = 100
): [number, number][] {
    const coords: [number, number][] = [];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    // Scale arc height to distance (cap at 2.5° for very long arcs)
    const maxOffset = Math.min(len * 0.25, 2.5);
    const nx = -dy / len; // normal x
    const ny = dx / len;  // normal y

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lng = start[0] + dx * t;
        const lat = start[1] + dy * t;
        const arc = Math.sin(t * Math.PI) * maxOffset;
        coords.push([lng + nx * arc, lat + ny * arc]);
    }
    return coords;
}

// ── Types ────────────────────────────────────────────────────

// (VisitorGeo replaced by shared LocationData from useDynamicLocation)

// ── Hooks ────────────────────────────────────────────────────

/** Detect system dark mode preference */
function useIsDark() {
    const [dark, setDark] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        setTimeout(() => setDark(mq.matches), 0);
        const handler = (e: MediaQueryListEvent) => setDark(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return dark;
}

// ── Component ────────────────────────────────────────────────

export function MapCard() {
    const mapConfig = siteConfig.map;
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const isDark = useIsDark();
    const visitorLocation = useDynamicLocation();

    // Find 合肥 from config markers
    const hefeiCoords: [number, number] = useMemo(() => {
        const hefeiMarker = mapConfig?.markers.find((m) => m.name === "合肥");
        return hefeiMarker ? hefeiMarker.coordinates : [117.2272, 31.8206];
    }, [mapConfig?.markers]);

    // Distance calculation
    const visitorCoords: [number, number] | null = useMemo(() => {
        return visitorLocation ? [visitorLocation.lon, visitorLocation.lat] : null;
    }, [visitorLocation]);

    const distanceKm = useMemo(() => {
        return visitorCoords ? haversineKm(hefeiCoords, visitorCoords) : null;
    }, [hefeiCoords, visitorCoords]);

    // Draw the arc + visitor marker once both map and geo are ready
    const drawArc = useCallback(
        (map: mapboxgl.Map) => {
            if (!visitorCoords) return;

            // Cleanup old markers if re-drawing (e.g. theme change)
            const oldMarkers = document.querySelectorAll(".map-dynamic-marker");
            oldMarkers.forEach((m) => m.remove());

            // --- Visitor marker ---
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
                        `<span class="map-popup-content">📍 ${visitorLocation!.city}（你的位置）</span>`
                    )
                )
                .addTo(map);

            // --- Arc line ---
            const arcCoords = generateArc(hefeiCoords, visitorCoords, 120);
            const midIndex = Math.floor(arcCoords.length / 2);
            const midPoint = arcCoords[midIndex];

            // --- Distance Midpoint Label ---
            if (distanceKm) {
                const lang = navigator.language || "en";
                const isZh = lang.startsWith("zh");
                const labelText = isZh ? "与您距离我" : "Distance from me:";

                const labelEl = document.createElement("div");
                labelEl.className = "map-arc-distance map-dynamic-marker";
                labelEl.innerHTML = `<span class="opacity-80 mr-1 text-[11px] font-normal tracking-wide">${labelText}</span><span class="font-bold text-[12px]">${distanceKm}</span><span class="text-[10px] opacity-80 ml-[2px]">km</span>`;
                new mapboxgl.Marker({ element: labelEl, anchor: "bottom", offset: [0, -4] })
                    .setLngLat(midPoint as [number, number])
                    .addTo(map);
            }

            if (map.getSource("visitor-arc")) {
                (map.getSource("visitor-arc") as mapboxgl.GeoJSONSource).setData({
                    type: "Feature",
                    properties: {},
                    geometry: { type: "LineString", coordinates: arcCoords },
                });

                // Update line color if theme changed
                map.setPaintProperty("visitor-arc-line", "line-color", isDark
                    ? "rgba(251, 113, 133, 0.7)"
                    : "rgba(190, 24, 93, 0.6)"
                );
            } else {
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
                        "line-color": isDark
                            ? "rgba(251, 113, 133, 0.7)"
                            : "rgba(190, 24, 93, 0.6)",
                        "line-width": 2,
                        "line-dasharray": [2, 2],
                    },
                });
            }
        },
        [visitorCoords, isDark, hefeiCoords, distanceKm, visitorLocation]
    );

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
            map.setConfigProperty("basemap", "lightPreset",
                isDark ? "night" : "day"
            );

            const lang = navigator.language || "en";
            const mapLang = lang.startsWith("zh-TW") || lang.startsWith("zh-Hant")
                ? "zh-Hant"
                : lang.startsWith("zh")
                    ? "zh-Hans"
                    : lang.split("-")[0];
            map.setConfigProperty("basemap", "language", mapLang);

            // City markers
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

            // Draw arc if geo already loaded
            drawArc(map);
        });

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [mapConfig, isDark, drawArc]);

    // If visitor geo arrives after map is ready, draw the arc
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !visitorLocation) return;
        if (map.isStyleLoaded()) {
            drawArc(map);
        }
    }, [visitorLocation, drawArc]);

    if (!mapConfig) return null;

    return (
        <GlassCard className="map-card relative p-0 overflow-hidden h-full">
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
