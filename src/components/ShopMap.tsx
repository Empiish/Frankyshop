"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export function ShopMap({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Use any to avoid pulling Leaflet types at top-level (which would trigger window access).
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const pinIcon = L.divIcon({
        className: "franky-pin",
        html: `<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;background:#c2410c;transform:rotate(-45deg);box-shadow:0 6px 18px rgba(194,65,12,.35);border:3px solid white"></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
      }).setView([lat, lng], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      L.marker([lat, lng], { icon: pinIcon }).addTo(map).bindPopup(label);

      mapRef.current = map;
      cleanup = () => {
        map.remove();
        mapRef.current = null;
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [lat, lng, label]);

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full overflow-hidden rounded-[2rem] border border-border"
      role="img"
      aria-label={label}
    />
  );
}
