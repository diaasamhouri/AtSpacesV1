"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBranch } from "../../../../lib/vendor";
import { useAuth } from "../../../../lib/auth-context";
import { City } from "../../../../lib/types";
import dynamic from "next/dynamic";

const MapDisplay = dynamic(() => import("../../../components/map-display"), { ssr: false });

const CITIES: City[] = ["AMMAN", "IRBID", "AQABA"];
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const COMMON_AMENITIES = [
    "WiFi", "Parking", "Air Conditioning", "Kitchen", "Coffee & Tea",
    "Printer", "Whiteboard", "Projector", "Standing Desk", "Locker",
    "Reception", "Elevator", "CCTV", "24/7 Access", "Prayer Room",
];

/** Extract lat/lng from a Google Maps URL */
function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
    // Pattern: @31.9539,35.9106 or ?q=31.9539,35.9106 or /place/31.9539,35.9106
    const patterns = [
        /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        /\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/,
        /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1] && match[2]) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return { lat, lng };
            }
        }
    }
    return null;
}

export default function NewBranchPage() {
    const router = useRouter();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        name: "", city: "AMMAN" as City, address: "", description: "", phone: "", email: "", googleMapsUrl: "",
    });

    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    const [operatingHours, setOperatingHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
        Object.fromEntries(DAYS.map(d => [d, { open: "09:00", close: "18:00", closed: d === "friday" }]))
    );

    const [amenities, setAmenities] = useState<string[]>([]);
    const [amenityInput, setAmenityInput] = useState("");

    const handleGoogleMapsChange = (url: string) => {
        setFormData({ ...formData, googleMapsUrl: url });
        const extracted = extractCoordsFromUrl(url);
        if (extracted) setCoords(extracted);
    };

    const toggleAmenity = (a: string) => {
        if (amenities.includes(a)) setAmenities(amenities.filter(x => x !== a));
        else setAmenities([...amenities, a]);
    };

    const addCustomAmenity = () => {
        if (amenityInput.trim() && !amenities.includes(amenityInput.trim())) {
            setAmenities([...amenities, amenityInput.trim()]);
            setAmenityInput("");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setLoading(true);
        setError("");

        try {
            const payload: any = {
                name: formData.name, city: formData.city, address: formData.address, amenities,
            };
            if (formData.description) payload.description = formData.description;
            if (formData.phone) payload.phone = formData.phone;
            if (formData.email) payload.email = formData.email;
            if (formData.googleMapsUrl) payload.googleMapsUrl = formData.googleMapsUrl;
            if (coords) { payload.latitude = coords.lat; payload.longitude = coords.lng; }

            const hours: Record<string, any> = {};
            for (const day of DAYS) {
                const h = operatingHours[day];
                if (h && !h.closed) hours[day] = { open: h.open, close: h.close };
            }
            payload.operatingHours = hours;

            await createBranch(token!, payload);
            router.push("/vendor/branches");
        } catch (err: any) {
            setError(err.message || "Failed to create branch.");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Branch</h1>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                <span className="text-xl mt-0.5">⏳</span>
                <div>
                    <h3 className="text-sm font-semibold text-amber-800">Admin Approval Required</h3>
                    <p className="text-sm text-amber-700 mt-0.5">New branches are set to "Under Review" and require admin approval before appearing to customers.</p>
                </div>
            </div>

            <div className="rounded-xl bg-dark-900 p-6 shadow-sm ring-1 ring-slate-800">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <div className="rounded-xl bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">{error}</div>}

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">Branch Name *</label>
                            <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm bg-dark-850 focus:bg-dark-900 focus:border-brand-500 focus:ring-brand-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">City *</label>
                            <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value as City })}
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm bg-dark-850 focus:bg-dark-900 focus:border-brand-500 focus:ring-brand-500">
                                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">Address *</label>
                            <input type="text" required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm bg-dark-850 focus:bg-dark-900 focus:border-brand-500 focus:ring-brand-500" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">Description</label>
                            <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm bg-dark-850 focus:bg-dark-900 focus:border-brand-500 focus:ring-brand-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">Phone</label>
                            <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm bg-dark-850 focus:bg-dark-900 focus:border-brand-500 focus:ring-brand-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">Email</label>
                            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm bg-dark-850 focus:bg-dark-900 focus:border-brand-500 focus:ring-brand-500" />
                        </div>
                    </div>

                    {/* Google Maps URL → auto-extracts coords */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            Google Maps Link <span className="text-xs text-slate-500 font-normal">(paste link → map appears automatically)</span>
                        </label>
                        <input type="url" placeholder="https://maps.google.com/..." value={formData.googleMapsUrl}
                            onChange={(e) => handleGoogleMapsChange(e.target.value)}
                            className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm bg-dark-850 focus:bg-dark-900 focus:border-brand-500 focus:ring-brand-500" />
                        {coords && (
                            <div className="mt-3">
                                <MapDisplay lat={coords.lat} lng={coords.lng} name={formData.name || "Branch Location"} height="250px" />
                                <div className="mt-1 flex gap-4 text-xs text-slate-500">
                                    <span>Lat: {coords.lat.toFixed(6)}</span>
                                    <span>Lng: {coords.lng.toFixed(6)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Amenities */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Amenities & Facilities</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {COMMON_AMENITIES.map((a) => {
                                const active = amenities.includes(a);
                                return (
                                    <button key={a} type="button" onClick={() => toggleAmenity(a)}
                                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${active ? "bg-brand-500 text-white" : "bg-dark-800 text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-dark-800"}`}>
                                        {active && "✓ "}{a}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Custom amenities */}
                        <div className="flex flex-wrap gap-2 mb-2">
                            {amenities.filter(a => !COMMON_AMENITIES.includes(a)).map((a, i) => (
                                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                                    {a}
                                    <button type="button" onClick={() => setAmenities(amenities.filter(x => x !== a))} className="text-indigo-400 hover:text-indigo-600">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input type="text" value={amenityInput} onChange={(e) => setAmenityInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomAmenity(); } }}
                                placeholder="Add custom amenity..."
                                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm bg-dark-850 focus:bg-dark-900 focus:border-brand-500" />
                            <button type="button" onClick={addCustomAmenity} className="rounded-xl bg-dark-800 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-dark-800">Add</button>
                        </div>
                    </div>

                    {/* Operating Hours */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Operating Hours</label>
                        <div className="space-y-2">
                            {DAYS.map((day) => (
                                <div key={day} className="flex items-center gap-3 rounded-lg bg-dark-850 px-4 py-2">
                                    <span className="w-24 text-sm font-medium text-slate-600 dark:text-slate-300 capitalize">{day}</span>
                                    <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
                                        <input type="checkbox" checked={!(operatingHours[day] || { closed: false }).closed}
                                            onChange={(e) => {
                                                const prev = operatingHours[day] || { open: "09:00", close: "18:00", closed: false };
                                                setOperatingHours({ ...operatingHours, [day]: { ...prev, closed: !e.target.checked } });
                                            }}
                                            className="rounded border-slate-200 dark:border-slate-700 text-brand-500 focus:ring-brand-500" />
                                        Open
                                    </label>
                                    {!(operatingHours[day] || { closed: false }).closed ? (
                                        <div className="flex items-center gap-2 ml-auto">
                                            <input type="time" value={(operatingHours[day] || { open: "09:00" }).open}
                                                onChange={(e) => {
                                                    const prev = operatingHours[day] || { open: "09:00", close: "18:00", closed: false };
                                                    setOperatingHours({ ...operatingHours, [day]: { ...prev, open: e.target.value } });
                                                }}
                                                className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs" />
                                            <span className="text-xs text-slate-500">to</span>
                                            <input type="time" value={(operatingHours[day] || { close: "18:00" }).close}
                                                onChange={(e) => {
                                                    const prev = operatingHours[day] || { open: "09:00", close: "18:00", closed: false };
                                                    setOperatingHours({ ...operatingHours, [day]: { ...prev, close: e.target.value } });
                                                }}
                                                className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs" />
                                        </div>
                                    ) : (
                                        <span className="ml-auto text-xs text-slate-500">Closed</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button type="button" onClick={() => router.back()} className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-dark-800 hover:bg-gray-100 dark:hover:bg-dark-800">Cancel</button>
                        <button type="submit" disabled={loading}
                            className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">
                            {loading ? "Submitting..." : "Submit for Review"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
