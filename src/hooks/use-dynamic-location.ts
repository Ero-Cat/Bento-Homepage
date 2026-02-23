"use client";

import { useEffect, useState, useRef } from "react";
import { siteConfig } from "@/config/site";

// ── Types ────────────────────────────────────────────────────

export interface LocationData {
    lat: number;
    lon: number;
    city: string;
    /** Where the location data came from */
    source: "geolocation" | "ip" | "config";
}

// ── Singleton Cache ──────────────────────────────────────────
// Avoid duplicate API calls across multiple components using this hook.

let cachedLocation: LocationData | null = null;
let fetchPromise: Promise<LocationData> | null = null;
const listeners = new Set<(loc: LocationData) => void>();

function notifyListeners(loc: LocationData) {
    cachedLocation = loc;
    listeners.forEach((fn) => fn(loc));
}

/**
 * Core fetch logic with 3-tier fallback:
 * 1. Browser Geolocation API (triggers permission prompt)
 * 2. IP-based geolocation via ip-api.com
 * 3. Static config from siteConfig.weather
 */
async function fetchLocation(): Promise<LocationData> {
    // 1. Try Browser Geolocation
    if ("geolocation" in navigator) {
        try {
            const pos = await new Promise<GeolocationPosition>(
                (resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 3000,
                        maximumAge: 1000 * 60 * 60, // 1-hour cache
                    });
                }
            );

            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            // Reverse geocode for city name (Chinese)
            try {
                const geoRes = await fetch(
                    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`
                );
                const geoData = await geoRes.json();
                return {
                    lat,
                    lon,
                    city: geoData.city || geoData.locality || "当前位置",
                    source: "geolocation",
                };
            } catch {
                return { lat, lon, city: "当前位置", source: "geolocation" };
            }
        } catch {
            // Geolocation denied or timed out — fall through to IP
            console.log("Geolocation failed, falling back to IP…");
        }
    }

    // 2. Fallback: IP-based geolocation
    try {
        const ipRes = await fetch(
            "https://ip-api.com/json/?fields=city,lat,lon&lang=zh-CN"
        );
        const ipData = await ipRes.json();
        if (ipData.lat && ipData.lon) {
            return {
                lat: ipData.lat,
                lon: ipData.lon,
                city: ipData.city || "当前位置",
                source: "ip",
            };
        }
    } catch (e) {
        console.error("IP fallback failed:", e);
    }

    // 3. Ultimate fallback: site config
    const configLoc = siteConfig.weather || {
        city: "合肥",
        lat: 31.8206,
        lon: 117.2272,
    };
    return {
        lat: configLoc.lat,
        lon: configLoc.lon,
        city: configLoc.city,
        source: "config",
    };
}

/**
 * Shared, deduplicated location fetch.
 * Multiple callers will share the same in-flight request.
 */
function getLocation(force = false): Promise<LocationData> {
    if (!force && cachedLocation) return Promise.resolve(cachedLocation);
    if (!force && fetchPromise) return fetchPromise;

    fetchPromise = fetchLocation().then((loc) => {
        cachedLocation = loc;
        fetchPromise = null;
        return loc;
    });

    return fetchPromise;
}

// ── Hook ─────────────────────────────────────────────────────

/**
 * Shared hook for dynamic location with 3-tier fallback:
 *   Geolocation → IP → Config
 *
 * Features:
 * - Singleton cache: all components share one location fetch
 * - Permission listener: auto-refreshes when user grants geolocation
 * - Returns `null` until location is resolved
 */
export function useDynamicLocation() {
    const [location, setLocation] = useState<LocationData | null>(
        cachedLocation
    );
    const permissionResultRef = useRef<PermissionStatus | null>(null);

    useEffect(() => {
        let mounted = true;

        // Subscribe to future updates from other components or permission changes
        const onUpdate = (loc: LocationData) => {
            if (mounted) setLocation(loc);
        };
        listeners.add(onUpdate);

        // Initial fetch
        getLocation().then((loc) => {
            if (mounted) setLocation(loc);
        });

        // Listen for geolocation permission changes
        if ("permissions" in navigator) {
            navigator.permissions
                .query({ name: "geolocation" })
                .then((result) => {
                    if (!mounted) return;
                    permissionResultRef.current = result;

                    result.onchange = () => {
                        if (result.state === "granted") {
                            // User just granted permission — refetch with geolocation
                            getLocation(true).then((loc) => {
                                notifyListeners(loc);
                            });
                        }
                    };
                })
                .catch(() => {
                    // Ignore permissions API errors (e.g. Firefox)
                });
        }

        return () => {
            mounted = false;
            listeners.delete(onUpdate);
            // Clean up permission listener
            if (permissionResultRef.current) {
                permissionResultRef.current.onchange = null;
            }
        };
    }, []);

    return location;
}
