"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapDisplayProps {
    lat: number;
    lng: number;
    name?: string;
    height?: string;
    interactive?: boolean;
    onLocationSelect?: (lat: number, lng: number) => void;
}

export default function MapDisplay({ lat, lng, name, height = "250px", interactive = false, onLocationSelect }: MapDisplayProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;

        // Fix default icon paths for Leaflet in webpack/next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15);
            if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
            else markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
            return;
        }

        const map = L.map(mapRef.current, {
            center: [lat, lng],
            zoom: 15,
            scrollWheelZoom: interactive,
            dragging: interactive,
            zoomControl: interactive,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        }).addTo(map);

        markerRef.current = L.marker([lat, lng]).addTo(map);
        if (name) markerRef.current.bindPopup(name);

        if (interactive && onLocationSelect) {
            map.on("click", (e: L.LeafletMouseEvent) => {
                const { lat: newLat, lng: newLng } = e.latlng;
                if (markerRef.current) markerRef.current.setLatLng([newLat, newLng]);
                else markerRef.current = L.marker([newLat, newLng]).addTo(map);
                onLocationSelect(newLat, newLng);
            });
        }

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            markerRef.current = null;
        };
    }, [lat, lng]);

    return <div ref={mapRef} style={{ height, width: "100%" }} className="rounded-xl z-0" />;
}
