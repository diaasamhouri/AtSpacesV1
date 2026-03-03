"use client";

import dynamic from "next/dynamic";

const MapDisplay = dynamic(() => import("./map-display"), { ssr: false });

interface SpaceMapSectionProps {
    lat: number;
    lng: number;
    name: string;
}

export function SpaceMapSection({ lat, lng, name }: SpaceMapSectionProps) {
    return (
        <div className="rounded-2xl overflow-hidden ring-1 ring-slate-800 shadow-sm">
            <MapDisplay lat={lat} lng={lng} name={name} height="300px" />
        </div>
    );
}
