"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../lib/auth-context";
import { getVendorBranchById, createService, deleteService, updateService, updateBranch } from "../../../../lib/vendor";
import dynamic from "next/dynamic";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog";

const MapDisplay = dynamic(() => import("../../../components/map-display"), { ssr: false });

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "bg-green-500/10 text-green-500 border border-green-500/20",
    UNDER_REVIEW: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
    SUSPENDED: "bg-red-500/100/10 text-red-500 border border-red-500/20",
};

const COMMON_AMENITIES = [
    "WiFi", "Parking", "Air Conditioning", "Kitchen", "Coffee & Tea",
    "Printer", "Whiteboard", "Projector", "Standing Desk", "Locker",
    "Reception", "Elevator", "CCTV", "24/7 Access", "Prayer Room",
];

/** Extract lat/lng from a Google Maps URL */
function extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
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
            if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90) return { lat, lng };
        }
    }
    return null;
}

export default function VendorBranchDetailPage() {
    const { id } = useParams() as { id: string };
    const { token } = useAuth();
    const router = useRouter();

    const [branch, setBranch] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Add service state
    const [showAddService, setShowAddService] = useState(false);
    const [submittingService, setSubmittingService] = useState(false);
    const [newService, setNewService] = useState({ type: "HOT_DESK", name: "", capacity: 1, priceHourly: "", priceDaily: "", priceMonthly: "" });

    // Edit service state
    const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
    const [editService, setEditService] = useState({ name: "", capacity: 1, priceHourly: "", priceDaily: "", priceMonthly: "" });
    const [savingEdit, setSavingEdit] = useState(false);

    // Amenities edit state
    const [editingAmenities, setEditingAmenities] = useState(false);
    const [amenities, setAmenities] = useState<string[]>([]);
    const [amenityInput, setAmenityInput] = useState("");
    const [savingAmenities, setSavingAmenities] = useState(false);

    // Google Maps URL edit state
    const [editingMap, setEditingMap] = useState(false);
    const [googleMapsUrl, setGoogleMapsUrl] = useState("");
    const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [savingMap, setSavingMap] = useState(false);

    // Confirm dialog for delete service
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteServiceTarget, setDeleteServiceTarget] = useState<string | null>(null);

    const loadBranch = () => {
        if (!token) return;
        setLoading(true);
        getVendorBranchById(token, id)
            .then((data) => {
                setBranch(data);
                setAmenities(data.amenities || []);
                setGoogleMapsUrl(data.googleMapsUrl || "");
                if (data.latitude && data.longitude) setMapCoords({ lat: data.latitude, lng: data.longitude });
                setLoading(false);
            })
            .catch((err) => { setError(err.message || "Failed to load branch."); setLoading(false); });
    };

    useEffect(() => { loadBranch(); }, [token, id]);

    // === Booking Settings handlers ===
    const toggleAutoAccept = async () => {
        if (!token || !branch) return;
        try {
            const newValue = !branch.autoAcceptBookings;
            await updateBranch(token, id, { autoAcceptBookings: newValue });
            setBranch({ ...branch, autoAcceptBookings: newValue });
        } catch (err: any) {
            alert(err.message || "Failed to update booking settings.");
        }
    };

    // === Service handlers ===
    const handleAddService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setSubmittingService(true);
        try {
            const pricing = [];
            if (newService.priceHourly) pricing.push({ interval: "HOURLY", price: Number(newService.priceHourly) });
            if (newService.priceDaily) pricing.push({ interval: "DAILY", price: Number(newService.priceDaily) });
            if (newService.priceMonthly) pricing.push({ interval: "MONTHLY", price: Number(newService.priceMonthly) });
            if (pricing.length === 0) throw new Error("Add at least one price interval.");
            await createService(token, { branchId: id, type: newService.type, name: newService.name, capacity: Number(newService.capacity), pricing });
            setShowAddService(false);
            setNewService({ type: "HOT_DESK", name: "", capacity: 1, priceHourly: "", priceDaily: "", priceMonthly: "" });
            loadBranch();
        } catch (err: any) { alert(err.message || "Failed to add service"); }
        setSubmittingService(false);
    };

    const handleDeleteServiceClick = (serviceId: string) => {
        setDeleteServiceTarget(serviceId);
        setConfirmDeleteOpen(true);
    };

    const handleDeleteServiceConfirm = async () => {
        if (!token || !deleteServiceTarget) return;
        try { await deleteService(token, deleteServiceTarget); loadBranch(); }
        catch (err: any) { alert(err.message || "Failed to delete service."); }
        setConfirmDeleteOpen(false);
        setDeleteServiceTarget(null);
    };

    const startEdit = (svc: any) => {
        setEditingServiceId(svc.id);
        setEditService({
            name: svc.name || "", capacity: svc.capacity || 1,
            priceHourly: svc.pricing?.find((p: any) => p.interval === "HOURLY")?.price?.toString() || "",
            priceDaily: svc.pricing?.find((p: any) => p.interval === "DAILY")?.price?.toString() || "",
            priceMonthly: svc.pricing?.find((p: any) => p.interval === "MONTHLY")?.price?.toString() || "",
        });
    };

    const handleSaveEdit = async () => {
        if (!token || !editingServiceId) return;
        setSavingEdit(true);
        try {
            const pricing = [];
            if (editService.priceHourly) pricing.push({ interval: "HOURLY", price: Number(editService.priceHourly) });
            if (editService.priceDaily) pricing.push({ interval: "DAILY", price: Number(editService.priceDaily) });
            if (editService.priceMonthly) pricing.push({ interval: "MONTHLY", price: Number(editService.priceMonthly) });
            if (pricing.length === 0) throw new Error("At least one price required.");
            await updateService(token, editingServiceId, { name: editService.name, capacity: Number(editService.capacity), pricing });
            setEditingServiceId(null);
            loadBranch();
        } catch (err: any) { alert(err.message || "Failed to update service."); }
        setSavingEdit(false);
    };

    // === Amenities handlers ===
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
    const handleSaveAmenities = async () => {
        if (!token) return;
        setSavingAmenities(true);
        try { await updateBranch(token, id, { amenities }); setEditingAmenities(false); loadBranch(); }
        catch { alert("Failed to save amenities."); }
        setSavingAmenities(false);
    };

    // === Google Maps URL handler ===
    const handleGoogleMapsChange = (url: string) => {
        setGoogleMapsUrl(url);
        const extracted = extractCoordsFromUrl(url);
        if (extracted) setMapCoords(extracted);
    };
    const handleSaveMap = async () => {
        if (!token) return;
        setSavingMap(true);
        try {
            const data: any = { googleMapsUrl };
            if (mapCoords) { data.latitude = mapCoords.lat; data.longitude = mapCoords.lng; }
            await updateBranch(token, id, data);
            setEditingMap(false);
            loadBranch();
        } catch { alert("Failed to save map."); }
        setSavingMap(false);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading branch details...</div>;
    if (error || !branch) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl bg-dark-900 p-8 shadow-sm border border-slate-800">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white">{branch.name}</h1>
                        <p className="mt-1 text-sm font-medium text-slate-400">{branch.address}, {branch.city}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase ${STATUS_COLORS[branch.status] || "bg-slate-500/10 text-slate-400 border border-slate-500/20"}`}>
                        {branch.status === "UNDER_REVIEW" ? "Under Review" : branch.status}
                    </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
                    {branch.phone && <span className="text-slate-300 flex items-center gap-1.5"><svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg> {branch.phone}</span>}
                    {branch.email && <span className="text-slate-300 flex items-center gap-1.5"><svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg> {branch.email}</span>}
                </div>
            </div>

            {/* Booking Settings */}
            <div className="rounded-2xl bg-dark-900 p-8 shadow-sm border border-slate-800 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Booking Settings</h2>
                    <p className="text-sm font-medium text-slate-300">
                        Automatically accept new bookings when capacity allows. If disabled, new requests require manual approval.
                    </p>
                </div>
                <button
                    onClick={toggleAutoAccept}
                    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-dark-900 ${branch.autoAcceptBookings ? 'bg-brand-500' : 'bg-slate-700'
                        }`}
                >
                    <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-dark-900 shadow ring-0 transition duration-200 ease-in-out ${branch.autoAcceptBookings ? 'translate-x-5' : 'translate-x-0'
                            }`}
                    />
                </button>
            </div>

            {/* Location / Map */}
            <div className="rounded-2xl bg-dark-900 p-8 shadow-sm border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Location</h2>
                    <button onClick={() => setEditingMap(!editingMap)} className="text-xs font-bold text-brand-500 hover:text-brand-400 transition-colors">
                        {editingMap ? "Cancel" : "Edit"}
                    </button>
                </div>

                {editingMap ? (
                    <div className="space-y-4">
                        <input type="url" placeholder="Paste Google Maps link..." value={googleMapsUrl}
                            onChange={(e) => handleGoogleMapsChange(e.target.value)}
                            className="block w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-white bg-dark-950 focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500" />
                        {mapCoords && (
                            <div className="rounded-xl overflow-hidden border border-slate-800">
                                <MapDisplay lat={mapCoords.lat} lng={mapCoords.lng} name={branch.name} height="220px" />
                                <div className="flex gap-6 p-3 bg-dark-850 text-xs font-bold text-slate-400 border-t border-slate-800">
                                    <span>Lat: {mapCoords.lat.toFixed(6)}</span>
                                    <span>Lng: {mapCoords.lng.toFixed(6)}</span>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end pt-2">
                            <button onClick={handleSaveMap} disabled={savingMap} className="rounded-xl bg-brand-500 active:scale-95 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 shadow-sm disabled:opacity-50 transition-all">
                                {savingMap ? "Saving..." : "Save Location"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {branch.googleMapsUrl && (
                            <a href={branch.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-500 hover:text-brand-400 font-bold mb-4 inline-flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg> View on Google Maps
                            </a>
                        )}
                        {(branch.latitude && branch.longitude) ? (
                            <div className="rounded-xl overflow-hidden shadow-sm border border-slate-800 relative z-0">
                                <MapDisplay lat={branch.latitude} lng={branch.longitude} name={branch.name} height="240px" />
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-700 bg-dark-850 p-8 text-center">
                                <p className="text-sm font-medium text-slate-400">No location set. Click "Edit" and paste a Google Maps link to show the map.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Amenities */}
            <div className="rounded-2xl bg-dark-900 p-8 shadow-sm border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Amenities & Facilities</h2>
                    <button onClick={() => { setEditingAmenities(!editingAmenities); setAmenities(branch.amenities || []); }}
                        className="text-xs font-bold text-brand-500 hover:text-brand-400 transition-colors">
                        {editingAmenities ? "Cancel" : "Edit"}
                    </button>
                </div>

                {editingAmenities ? (
                    <div className="space-y-6">
                        <div className="flex flex-wrap gap-2">
                            {COMMON_AMENITIES.map((a) => {
                                const active = amenities.includes(a);
                                return (
                                    <button key={a} type="button" onClick={() => toggleAmenity(a)}
                                        className={`rounded-full px-4 py-2 text-xs font-bold transition-all border ${active ? "bg-brand-500 text-white border-brand-500 shadow-sm" : "bg-dark-850 text-slate-300 border-slate-700 hover:border-slate-500 hover:bg-dark-800"}`}>
                                        {active && <span className="mr-1 opacity-80">✓</span>}{a}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Custom amenities */}
                        <div className="flex flex-wrap gap-2">
                            {amenities.filter(a => !COMMON_AMENITIES.includes(a)).map((a, i) => (
                                <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 px-4 py-2 text-xs font-bold text-brand-400">
                                    {a}
                                    <button onClick={() => setAmenities(amenities.filter(x => x !== a))} className="text-brand-500/60 hover:text-brand-400 hover:bg-brand-500/20 rounded-full w-4 h-4 flex items-center justify-center transition-colors">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <input type="text" value={amenityInput} onChange={(e) => setAmenityInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomAmenity(); } }}
                                placeholder="Add custom amenity..."
                                className="flex-1 rounded-xl border border-slate-700 px-4 py-3 text-sm text-white bg-dark-950 focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500" />
                            <button type="button" onClick={addCustomAmenity} className="rounded-xl bg-dark-800 border border-slate-700 px-6 py-3 text-sm font-bold text-white hover:bg-dark-700 transition-colors shadow-sm">Add</button>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button onClick={handleSaveAmenities} disabled={savingAmenities} className="rounded-xl bg-brand-500 active:scale-95 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 transition-all shadow-sm">
                                {savingAmenities ? "Saving..." : "Save Amenities"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {(branch.amenities?.length || 0) === 0 ? (
                            <p className="text-sm font-medium text-slate-500 py-4">No amenities set. Click "Edit" to add.</p>
                        ) : branch.amenities.map((a: string, i: number) => (
                            <span key={i} className="inline-flex rounded-full bg-dark-850 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300">{a}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Operating Hours */}
            {branch.operatingHours && Object.keys(branch.operatingHours).length > 0 && (
                <div className="rounded-2xl bg-dark-900 p-8 shadow-sm border border-slate-800">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Operating Hours</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
                            const hours = branch.operatingHours[day];
                            return (
                                <div key={day} className="rounded-xl bg-dark-850 px-4 py-3 border border-slate-700 shadow-sm">
                                    <div className="text-xs font-bold text-slate-300 capitalize mb-1">{day}</div>
                                    <div className="text-sm font-medium text-brand-400">{hours ? `${hours.open} – ${hours.close}` : "Closed"}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Services */}
            <div className="rounded-2xl bg-dark-900 p-8 shadow-sm border border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Services</h2>
                    <button onClick={() => setShowAddService(!showAddService)}
                        className="rounded-xl bg-dark-800 border border-slate-700 text-white px-5 py-2.5 text-sm font-bold hover:bg-dark-700 transition-colors shadow-sm">
                        {showAddService ? "Cancel" : "+ Add Service"}
                    </button>
                </div>

                {/* Add Service Form */}
                {showAddService && (
                    <form onSubmit={handleAddService} className="mb-8 border border-slate-700 rounded-2xl p-6 bg-dark-850 space-y-5 shadow-inner">
                        <h3 className="text-sm font-bold text-white">New Service</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">Type *</label>
                                <select required value={newService.type} onChange={(e) => setNewService({ ...newService, type: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-white bg-dark-950 focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors">
                                    <option value="HOT_DESK">Hot Desk</option>
                                    <option value="PRIVATE_OFFICE">Private Office</option>
                                    <option value="MEETING_ROOM">Meeting Room</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">Name *</label>
                                <input type="text" required value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                    placeholder="e.g. Quiet Zone Desk" className="block w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-white bg-dark-950 focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">Capacity *</label>
                                <input type="number" min="1" required value={newService.capacity} onChange={(e) => setNewService({ ...newService, capacity: parseInt(e.target.value) })}
                                    className="block w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-white bg-dark-950 focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-6 pt-5 border-t border-slate-800">
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">Hourly (JOD)</label>
                                <input type="number" step="0.01" value={newService.priceHourly} onChange={(e) => setNewService({ ...newService, priceHourly: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-white bg-dark-950 focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">Daily (JOD)</label>
                                <input type="number" step="0.01" value={newService.priceDaily} onChange={(e) => setNewService({ ...newService, priceDaily: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-white bg-dark-950 focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-300 mb-2">Monthly (JOD)</label>
                                <input type="number" step="0.01" value={newService.priceMonthly} onChange={(e) => setNewService({ ...newService, priceMonthly: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-white bg-dark-950 focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={submittingService} className="rounded-xl bg-brand-500 active:scale-95 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 transition-all shadow-sm">
                                {submittingService ? "Saving..." : "Save Service"}
                            </button>
                        </div>
                    </form>
                )}

                {/* Service list */}
                <div className="space-y-4">
                    {branch.services?.length === 0 ? (
                        <div className="text-center py-10 text-sm font-medium text-slate-500 border border-dashed border-slate-700 rounded-2xl bg-dark-850">No services added yet.</div>
                    ) : (
                        branch.services?.map((svc: any) => (
                            <div key={svc.id} className="rounded-2xl border border-slate-800 p-5 bg-dark-950 transition-all">
                                {editingServiceId === svc.id ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-300 mb-2">Name</label>
                                                <input type="text" value={editService.name} onChange={(e) => setEditService({ ...editService, name: e.target.value })}
                                                    className="block w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-white bg-dark-900 focus:bg-dark-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-300 mb-2">Capacity</label>
                                                <input type="number" min="1" value={editService.capacity} onChange={(e) => setEditService({ ...editService, capacity: parseInt(e.target.value) })}
                                                    className="block w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-white bg-dark-900 focus:bg-dark-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-300 mb-2">Hourly (JOD)</label>
                                                <input type="number" step="0.01" value={editService.priceHourly} onChange={(e) => setEditService({ ...editService, priceHourly: e.target.value })}
                                                    className="block w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-white bg-dark-900 focus:bg-dark-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-300 mb-2">Daily (JOD)</label>
                                                <input type="number" step="0.01" value={editService.priceDaily} onChange={(e) => setEditService({ ...editService, priceDaily: e.target.value })}
                                                    className="block w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-white bg-dark-900 focus:bg-dark-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-300 mb-2">Monthly (JOD)</label>
                                                <input type="number" step="0.01" value={editService.priceMonthly} onChange={(e) => setEditService({ ...editService, priceMonthly: e.target.value })}
                                                    className="block w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-white bg-dark-900 focus:bg-dark-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 pt-2">
                                            <button onClick={() => setEditingServiceId(null)} className="rounded-xl px-5 py-2 text-sm font-bold text-slate-300 bg-dark-800 border border-slate-700 hover:bg-dark-700 hover:text-white transition-colors">Cancel</button>
                                            <button onClick={handleSaveEdit} disabled={savingEdit} className="rounded-xl px-6 py-2 text-sm font-bold text-white bg-brand-500 active:scale-95 hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm">
                                                {savingEdit ? "Saving..." : "Save"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center flex-wrap gap-2 mb-2">
                                                <span className="text-lg font-bold text-white">{svc.name}</span>
                                                <span className="rounded-md bg-brand-500/10 border border-brand-500/20 px-2 py-1 text-[10px] font-bold text-brand-400 uppercase tracking-wider">{svc.type?.replace("_", " ")}</span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-400 bg-dark-900 p-3 rounded-xl border border-slate-800/50 inline-flex">
                                                <span className="flex items-center gap-1.5"><svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg> {svc.capacity}</span>
                                                <div className="w-px h-4 bg-slate-700 hidden sm:block"></div>
                                                {svc.pricing?.map((p: any) => (
                                                    <span key={p.interval} className="flex items-baseline gap-1">
                                                        <span className="text-xs text-slate-500 uppercase">{p.interval}:</span> <span className="text-white font-bold">JOD {Number(p.price).toFixed(2)}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0 sm:self-start">
                                            <button onClick={() => startEdit(svc)} className="rounded-lg bg-dark-850 border border-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-dark-800 transition-colors">Edit</button>
                                            <button onClick={() => handleDeleteServiceClick(svc.id)} className="rounded-lg bg-red-500/100/10 border border-red-500/20 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-500/100/20 transition-colors">Delete</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmDeleteOpen}
                onClose={() => { setConfirmDeleteOpen(false); setDeleteServiceTarget(null); }}
                onConfirm={handleDeleteServiceConfirm}
                title="Delete Service"
                message="Are you sure you want to delete this service? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
}
