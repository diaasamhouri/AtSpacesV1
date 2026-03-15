"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../lib/auth-context";
import { useToast } from "../../../components/ui/toast-provider";
import { getVendorBranchById, createService, deleteService, updateService, updateBranch } from "../../../../lib/vendor";
import { formatServiceType, formatRoomShape, formatSetupType } from "../../../../lib/format";
import StatusBadge from "../../../components/ui/status-badge";
import dynamic from "next/dynamic";
import { ConfirmDialog } from "../../../components/ui/confirm-dialog";
import { SERVICE_TYPE_OPTIONS, ROOM_SHAPE_OPTIONS, SETUP_TYPES, isSetupEligible, isSimpleCapacity } from "../../../../lib/types";
import type { VendorBranchDetail } from "../../../../lib/types";

const MapDisplay = dynamic(() => import("../../../components/map-display"), { ssr: false });

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
    const { toast } = useToast();
    const router = useRouter();

    const [branch, setBranch] = useState<VendorBranchDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Add service state
    const [showAddService, setShowAddService] = useState(false);
    const [submittingService, setSubmittingService] = useState(false);
    const [newService, setNewService] = useState({
        type: "HOT_DESK", name: "", unitNumber: "",
        pricePerBooking: "", pricePerPerson: "", pricePerHour: "",
        minCapacity: "", maxCapacity: "",
        floor: "", profileNameEn: "", profileNameAr: "", weight: "", netSize: "",
        shape: "", description: "", features: [] as string[],
        setupConfigs: [] as { setupType: string; minPeople: number; maxPeople: number }[],
    });
    const [newFeatureInput, setNewFeatureInput] = useState("");

    // Edit service state
    const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
    const [editService, setEditService] = useState({
        name: "", unitNumber: "",
        pricePerBooking: "", pricePerPerson: "", pricePerHour: "",
        minCapacity: "", maxCapacity: "",
        floor: "", profileNameEn: "", profileNameAr: "", weight: "", netSize: "",
        shape: "", description: "", features: [] as string[],
        setupConfigs: [] as { setupType: string; minPeople: number; maxPeople: number }[],
    });
    const [editFeatureInput, setEditFeatureInput] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);

    // Property details state
    const [editingProperty, setEditingProperty] = useState(false);
    const [propertyData, setPropertyData] = useState({ grossArea: "", receptionMobile: "", receptionEmail: "" });
    const [savingProperty, setSavingProperty] = useState(false);

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

    // Operating hours edit state
    const [editingHours, setEditingHours] = useState(false);
    const [hours, setHours] = useState<Record<string, { open: string; close: string } | null>>({});
    const [savingHours, setSavingHours] = useState(false);

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
            toast(err.message || "Failed to update booking settings.", "error");
        }
    };

    // === Property Details handlers ===
    const initProperty = () => {
        setPropertyData({
            grossArea: (branch as any)?.grossArea?.toString() || "",
            receptionMobile: (branch as any)?.receptionMobile || "",
            receptionEmail: (branch as any)?.receptionEmail || "",
        });
    };
    const handleSaveProperty = async () => {
        if (!token) return;
        setSavingProperty(true);
        try {
            const data: any = {};
            if (propertyData.grossArea) data.grossArea = Number(propertyData.grossArea);
            if (propertyData.receptionMobile) data.receptionMobile = propertyData.receptionMobile;
            if (propertyData.receptionEmail) data.receptionEmail = propertyData.receptionEmail;
            await updateBranch(token, id, data);
            setEditingProperty(false);
            loadBranch();
        } catch { toast("Failed to save property details.", "error"); }
        setSavingProperty(false);
    };

    // === Service handlers ===
    const handleAddService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setSubmittingService(true);
        try {
            if (!newService.pricePerBooking && !newService.pricePerPerson && !newService.pricePerHour) throw new Error("At least one price is required.");
            const payload: any = {
                branchId: id, type: newService.type, name: newService.name,
            };
            if (newService.pricePerBooking) payload.pricePerBooking = Number(newService.pricePerBooking);
            if (newService.pricePerPerson) payload.pricePerPerson = Number(newService.pricePerPerson);
            if (newService.pricePerHour) payload.pricePerHour = Number(newService.pricePerHour);
            if (newService.unitNumber) payload.unitNumber = newService.unitNumber;
            if (newService.minCapacity) payload.minCapacity = Number(newService.minCapacity);
            if (newService.maxCapacity) payload.capacity = Number(newService.maxCapacity);
            if (newService.setupConfigs.length > 0) payload.setupConfigs = newService.setupConfigs;
            if (newService.floor) payload.floor = newService.floor;
            if (newService.profileNameEn) payload.profileNameEn = newService.profileNameEn;
            if (newService.profileNameAr) payload.profileNameAr = newService.profileNameAr;
            if (newService.weight) payload.weight = Number(newService.weight);
            if (newService.netSize) payload.netSize = Number(newService.netSize);
            if (newService.shape) payload.shape = newService.shape;
            if (newService.description) payload.description = newService.description;
            if (newService.features.length > 0) payload.features = newService.features;
            await createService(token, payload);
            setShowAddService(false);
            setNewService({
                type: "HOT_DESK", name: "", unitNumber: "",
                pricePerBooking: "", pricePerPerson: "", pricePerHour: "",
                minCapacity: "", maxCapacity: "",
                floor: "", profileNameEn: "", profileNameAr: "", weight: "", netSize: "",
                shape: "", description: "", features: [], setupConfigs: [],
            });
            setNewFeatureInput("");
            loadBranch();
        } catch (err: any) { toast(err.message || "Failed to add service", "error"); }
        setSubmittingService(false);
    };

    const handleDeleteServiceClick = (serviceId: string) => {
        setDeleteServiceTarget(serviceId);
        setConfirmDeleteOpen(true);
    };

    const handleDeleteServiceConfirm = async () => {
        if (!token || !deleteServiceTarget) return;
        try { await deleteService(token, deleteServiceTarget); loadBranch(); }
        catch (err: any) { toast(err.message || "Failed to delete service.", "error"); }
        setConfirmDeleteOpen(false);
        setDeleteServiceTarget(null);
    };

    const startEdit = (svc: any) => {
        setEditingServiceId(svc.id);
        setEditService({
            name: svc.name || "", unitNumber: svc.unitNumber || "",
            pricePerBooking: svc.pricePerBooking != null ? String(Number(svc.pricePerBooking)) : "",
            pricePerPerson: svc.pricePerPerson != null ? String(Number(svc.pricePerPerson)) : "",
            pricePerHour: svc.pricePerHour != null ? String(Number(svc.pricePerHour)) : "",
            minCapacity: svc.minCapacity != null ? String(svc.minCapacity) : "",
            maxCapacity: svc.capacity != null ? String(svc.capacity) : "",
            floor: svc.floor || "", profileNameEn: svc.profileNameEn || "", profileNameAr: svc.profileNameAr || "",
            weight: svc.weight != null ? String(svc.weight) : "", netSize: svc.netSize != null ? String(svc.netSize) : "",
            shape: svc.shape || "", description: svc.description || "",
            features: svc.features || [],
            setupConfigs: (svc.setupConfigs || []).map((sc: any) => ({ setupType: sc.setupType, minPeople: sc.minPeople, maxPeople: sc.maxPeople })),
        });
        setEditFeatureInput("");
    };

    const handleSaveEdit = async () => {
        if (!token || !editingServiceId) return;
        setSavingEdit(true);
        try {
            if (!editService.pricePerBooking && !editService.pricePerPerson && !editService.pricePerHour) throw new Error("At least one price is required.");
            const payload: any = { name: editService.name };
            if (editService.pricePerBooking) payload.pricePerBooking = Number(editService.pricePerBooking); else payload.pricePerBooking = null;
            if (editService.pricePerPerson) payload.pricePerPerson = Number(editService.pricePerPerson); else payload.pricePerPerson = null;
            if (editService.pricePerHour) payload.pricePerHour = Number(editService.pricePerHour); else payload.pricePerHour = null;
            payload.unitNumber = editService.unitNumber || undefined;
            if (editService.minCapacity) payload.minCapacity = Number(editService.minCapacity);
            if (editService.maxCapacity) payload.capacity = Number(editService.maxCapacity);
            payload.setupConfigs = editService.setupConfigs.length > 0 ? editService.setupConfigs : undefined;
            payload.floor = editService.floor || undefined;
            payload.profileNameEn = editService.profileNameEn || undefined;
            payload.profileNameAr = editService.profileNameAr || undefined;
            payload.weight = editService.weight ? Number(editService.weight) : undefined;
            payload.netSize = editService.netSize ? Number(editService.netSize) : undefined;
            payload.shape = editService.shape || undefined;
            payload.description = editService.description || undefined;
            payload.features = editService.features;
            await updateService(token, editingServiceId, payload);
            setEditingServiceId(null);
            loadBranch();
        } catch (err: any) { toast(err.message || "Failed to update service.", "error"); }
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
        catch { toast("Failed to save amenities.", "error"); }
        setSavingAmenities(false);
    };

    // === Operating Hours handlers ===
    const initHours = () => {
        const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        const current: Record<string, { open: string; close: string } | null> = {};
        DAYS.forEach((day) => {
            const h = branch?.operatingHours?.[day];
            current[day] = h ? { open: h.open, close: h.close } : null;
        });
        setHours(current);
    };
    const toggleDayClosed = (day: string) => {
        setHours((prev) => ({
            ...prev,
            [day]: prev[day] ? null : { open: "09:00", close: "17:00" },
        }));
    };
    const updateDayTime = (day: string, field: "open" | "close", value: string) => {
        setHours((prev) => ({
            ...prev,
            [day]: prev[day] ? { ...prev[day]!, [field]: value } : { open: "09:00", close: "17:00", [field]: value },
        }));
    };
    const handleSaveHours = async () => {
        if (!token) return;
        setSavingHours(true);
        try {
            await updateBranch(token, id, { operatingHours: hours });
            setEditingHours(false);
            loadBranch();
        } catch { toast("Failed to save operating hours.", "error"); }
        setSavingHours(false);
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
        } catch { toast("Failed to save map.", "error"); }
        setSavingMap(false);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading branch details...</div>;
    if (error || !branch) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => router.push("/vendor/branches")} className="rounded-lg p-2 text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-dark-800 transition-colors" title="Back to Branches">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{branch.name}</h1>
                            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{branch.address}, {branch.city}</p>
                        </div>
                    </div>
                    <StatusBadge status={branch.status} size="md" />
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
                    {branch.phone && <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5"><svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg> {branch.phone}</span>}
                    {branch.email && <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5"><svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg> {branch.email}</span>}
                </div>
            </div>

            {/* Booking Settings */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Booking Settings</h2>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        Automatically accept new bookings when capacity allows. If disabled, new requests require manual approval.
                    </p>
                </div>
                <button
                    onClick={toggleAutoAccept}
                    className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-dark-900 ${branch.autoAcceptBookings ? 'bg-brand-500' : 'bg-slate-700'
                        }`}
                >
                    <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white dark:bg-dark-900 shadow ring-0 transition duration-200 ease-in-out ${branch.autoAcceptBookings ? 'translate-x-5' : 'translate-x-0'
                            }`}
                    />
                </button>
            </div>

            {/* Property Details */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Property Details</h2>
                    <button onClick={() => { setEditingProperty(!editingProperty); if (!editingProperty) initProperty(); }}
                        className="text-xs font-bold text-brand-500 hover:text-brand-400 transition-colors">
                        {editingProperty ? "Cancel" : "Edit"}
                    </button>
                </div>
                {editingProperty ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Gross Area (sqm)</label>
                                <input type="number" step="0.01" value={propertyData.grossArea} onChange={(e) => setPropertyData({ ...propertyData, grossArea: e.target.value })}
                                    placeholder="e.g. 150" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-gray-50 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Reception Mobile</label>
                                <input type="text" value={propertyData.receptionMobile} onChange={(e) => setPropertyData({ ...propertyData, receptionMobile: e.target.value })}
                                    placeholder="+962 7XX XXX XXXX" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-gray-50 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Reception Email</label>
                                <input type="email" value={propertyData.receptionEmail} onChange={(e) => setPropertyData({ ...propertyData, receptionEmail: e.target.value })}
                                    placeholder="reception@branch.com" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-gray-50 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button onClick={handleSaveProperty} disabled={savingProperty} className="rounded-xl bg-brand-500 active:scale-95 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 transition-all shadow-sm">
                                {savingProperty ? "Saving..." : "Save Property Details"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-xl bg-gray-50 dark:bg-dark-850 px-4 py-3 border border-slate-200 dark:border-slate-700">
                            <div className="text-xs font-bold text-slate-500 mb-1">Gross Area</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{(branch as any)?.grossArea ? `${(branch as any).grossArea} sqm` : "Not set"}</div>
                        </div>
                        <div className="rounded-xl bg-gray-50 dark:bg-dark-850 px-4 py-3 border border-slate-200 dark:border-slate-700">
                            <div className="text-xs font-bold text-slate-500 mb-1">Reception Mobile</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{(branch as any)?.receptionMobile || "Not set"}</div>
                        </div>
                        <div className="rounded-xl bg-gray-50 dark:bg-dark-850 px-4 py-3 border border-slate-200 dark:border-slate-700">
                            <div className="text-xs font-bold text-slate-500 mb-1">Reception Email</div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{(branch as any)?.receptionEmail || "Not set"}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Location / Map */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location</h2>
                    <button onClick={() => setEditingMap(!editingMap)} className="text-xs font-bold text-brand-500 hover:text-brand-400 transition-colors">
                        {editingMap ? "Cancel" : "Edit"}
                    </button>
                </div>

                {editingMap ? (
                    <div className="space-y-4">
                        <input type="url" placeholder="Paste Google Maps link..." value={googleMapsUrl}
                            onChange={(e) => handleGoogleMapsChange(e.target.value)}
                            className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-gray-50 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500" />
                        {mapCoords && (
                            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                                <MapDisplay lat={mapCoords.lat} lng={mapCoords.lng} name={branch.name} height="220px" />
                                <div className="flex gap-6 p-3 bg-gray-50 dark:bg-dark-850 text-xs font-bold text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
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
                            <div className="rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 relative z-0">
                                <MapDisplay lat={branch.latitude} lng={branch.longitude} name={branch.name} height="240px" />
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-gray-50 dark:bg-dark-850 p-8 text-center">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No location set. Click "Edit" and paste a Google Maps link to show the map.</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Amenities */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amenities & Facilities</h2>
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
                                        className={`rounded-full px-4 py-2 text-xs font-bold transition-all border ${active ? "bg-brand-500 text-white border-brand-500 shadow-sm" : "bg-dark-850 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-500 hover:bg-gray-100 dark:hover:bg-dark-800"}`}>
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
                                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-gray-50 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500" />
                            <button type="button" onClick={addCustomAmenity} className="rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 px-6 py-3 text-sm font-bold text-gray-900 dark:text-white hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors shadow-sm">Add</button>
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
                            <span key={i} className="inline-flex rounded-full bg-gray-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">{a}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Operating Hours */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Operating Hours</h2>
                    <button onClick={() => { setEditingHours(!editingHours); if (!editingHours) initHours(); }}
                        className="text-xs font-bold text-brand-500 hover:text-brand-400 transition-colors">
                        {editingHours ? "Cancel" : "Edit"}
                    </button>
                </div>

                {editingHours ? (
                    <div className="space-y-3">
                        {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                            <div key={day} className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-dark-850 px-4 py-3 border border-slate-200 dark:border-slate-700">
                                <span className="w-24 text-sm font-bold text-slate-600 dark:text-slate-300 capitalize">{day}</span>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hours[day] !== null}
                                        onChange={() => toggleDayClosed(day)}
                                        className="rounded border-slate-600 text-brand-500 focus:ring-brand-500"
                                    />
                                    <span className="text-xs font-medium text-slate-500">{hours[day] ? "Open" : "Closed"}</span>
                                </label>
                                {hours[day] && (
                                    <div className="flex items-center gap-2 ml-auto">
                                        <input
                                            type="time"
                                            value={hours[day]!.open}
                                            onChange={(e) => updateDayTime(day, "open", e.target.value)}
                                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-900 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                                        />
                                        <span className="text-slate-500">–</span>
                                        <input
                                            type="time"
                                            value={hours[day]!.close}
                                            onChange={(e) => updateDayTime(day, "close", e.target.value)}
                                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-900 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        <div className="flex justify-end pt-2">
                            <button onClick={handleSaveHours} disabled={savingHours} className="rounded-xl bg-brand-500 active:scale-95 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 transition-all shadow-sm">
                                {savingHours ? "Saving..." : "Save Hours"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => {
                            const h = branch.operatingHours?.[day];
                            return (
                                <div key={day} className="rounded-xl bg-gray-50 dark:bg-dark-850 px-4 py-3 border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="text-xs font-bold text-slate-600 dark:text-slate-300 capitalize mb-1">{day}</div>
                                    <div className="text-sm font-medium text-brand-400">{h ? `${h.open} – ${h.close}` : "Closed"}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Units */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Units</h2>
                    <button onClick={() => setShowAddService(!showAddService)}
                        className="rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white px-5 py-2.5 text-sm font-bold hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors shadow-sm">
                        {showAddService ? "Cancel" : "+ Add Unit"}
                    </button>
                </div>

                {/* Add Service Form */}
                {showAddService && (
                    <form onSubmit={handleAddService} className="mb-8 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 bg-gray-50 dark:bg-dark-850 space-y-5 shadow-inner">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">New Unit</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Type *</label>
                                <select required value={newService.type} onChange={(e) => setNewService({ ...newService, type: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-gray-50 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors">
                                    {SERVICE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Name *</label>
                                <input type="text" required value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                    placeholder="e.g. Quiet Zone Desk" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-gray-50 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Unit Number</label>
                                <input type="text" value={newService.unitNumber} onChange={(e) => setNewService({ ...newService, unitNumber: e.target.value })}
                                    placeholder="e.g. R-101" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-gray-50 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500" />
                            </div>
                        </div>
                        <div className="pt-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Pricing * <span className="font-normal text-slate-500">(at least one required)</span></label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Per Booking (JOD)</label>
                                    <input type="number" step="0.001" min="0" value={newService.pricePerBooking} onChange={(e) => setNewService({ ...newService, pricePerBooking: e.target.value })}
                                        placeholder="0.000" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Per Person (JOD)</label>
                                    <input type="number" step="0.001" min="0" value={newService.pricePerPerson} onChange={(e) => setNewService({ ...newService, pricePerPerson: e.target.value })}
                                        placeholder="0.000" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Per Hour (JOD)</label>
                                    <input type="number" step="0.001" min="0" value={newService.pricePerHour} onChange={(e) => setNewService({ ...newService, pricePerHour: e.target.value })}
                                        placeholder="0.000" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                        {/* Room details row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Floor</label>
                                <input type="text" value={newService.floor} onChange={(e) => setNewService({ ...newService, floor: e.target.value })} placeholder="e.g. Ground Floor"
                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-gray-50 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Profile Name (EN)</label>
                                <input type="text" value={newService.profileNameEn} onChange={(e) => setNewService({ ...newService, profileNameEn: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-gray-50 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Profile Name (AR)</label>
                                <input type="text" value={newService.profileNameAr} onChange={(e) => setNewService({ ...newService, profileNameAr: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-gray-50 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Weight</label>
                                <input type="number" value={newService.weight} onChange={(e) => setNewService({ ...newService, weight: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-gray-50 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Net Size (sqm)</label>
                                <input type="number" step="0.01" value={newService.netSize} onChange={(e) => setNewService({ ...newService, netSize: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-gray-50 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                            </div>
                            {isSetupEligible(newService.type) && (
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Shape</label>
                                <select value={newService.shape} onChange={(e) => setNewService({ ...newService, shape: e.target.value })}
                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-gray-50 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors">
                                    {ROOM_SHAPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            )}
                        </div>
                        {/* Capacity — simple min/max for HOT_DESK / PRIVATE_OFFICE */}
                        {isSimpleCapacity(newService.type) && (
                        <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">Capacity</label>
                            <div className="grid grid-cols-2 gap-4 max-w-xs">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Min People</label>
                                    <input type="number" min="1" value={newService.minCapacity} onChange={(e) => setNewService({ ...newService, minCapacity: e.target.value })}
                                        placeholder="1" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Max People</label>
                                    <input type="number" min="1" value={newService.maxCapacity} onChange={(e) => setNewService({ ...newService, maxCapacity: e.target.value })}
                                        placeholder="1" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                        )}
                        {/* Setup Configurations — only for MEETING_ROOM / EVENT_SPACE */}
                        {isSetupEligible(newService.type) && (
                        <div className="pt-5 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Setup Configurations</label>
                                <button type="button" onClick={() => setNewService({ ...newService, setupConfigs: [...newService.setupConfigs, { setupType: "CLASSROOM", minPeople: 1, maxPeople: 10 }] })}
                                    className="rounded-lg bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-gray-900 dark:text-white hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors">+ Add Setup Configuration</button>
                            </div>
                            {newService.setupConfigs.map((sc, idx) => (
                                <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 mb-2 items-end">
                                    <div>
                                        {idx === 0 && <label className="block text-xs font-bold text-slate-500 mb-1">Setup Type</label>}
                                        <select value={sc.setupType} onChange={(e) => { const updated = [...newService.setupConfigs]; updated[idx] = { ...sc, setupType: e.target.value }; setNewService({ ...newService, setupConfigs: updated }); }}
                                            className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors">
                                            {SETUP_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        {idx === 0 && <label className="block text-xs font-bold text-slate-500 mb-1">Min People</label>}
                                        <input type="number" min="1" value={sc.minPeople} onChange={(e) => { const updated = [...newService.setupConfigs]; updated[idx] = { ...sc, minPeople: parseInt(e.target.value) || 1 }; setNewService({ ...newService, setupConfigs: updated }); }}
                                            className="block w-24 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                    </div>
                                    <div>
                                        {idx === 0 && <label className="block text-xs font-bold text-slate-500 mb-1">Max People</label>}
                                        <input type="number" min="1" value={sc.maxPeople} onChange={(e) => { const updated = [...newService.setupConfigs]; updated[idx] = { ...sc, maxPeople: parseInt(e.target.value) || 1 }; setNewService({ ...newService, setupConfigs: updated }); }}
                                            className="block w-24 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                    </div>
                                    <button type="button" onClick={() => setNewService({ ...newService, setupConfigs: newService.setupConfigs.filter((_, i) => i !== idx) })}
                                        className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-3 text-xs font-bold text-red-500 hover:bg-red-500/20 transition-colors">Remove</button>
                                </div>
                            ))}
                            {newService.setupConfigs.length === 0 && <p className="text-xs font-medium text-slate-500 py-2">No setup configurations added.</p>}
                        </div>
                        )}
                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Description</label>
                                <textarea value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} rows={2}
                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-gray-50 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors resize-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Features</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {newService.features.map((f) => (
                                        <span key={f} className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1 text-xs font-bold text-brand-400">
                                            {f} <button type="button" onClick={() => setNewService({ ...newService, features: newService.features.filter(x => x !== f) })} className="text-brand-500/60 hover:text-brand-400">x</button>
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input type="text" value={newFeatureInput} onChange={(e) => setNewFeatureInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (newFeatureInput.trim() && !newService.features.includes(newFeatureInput.trim())) { setNewService({ ...newService, features: [...newService.features, newFeatureInput.trim()] }); setNewFeatureInput(""); } } }}
                                        placeholder="Add feature..." className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-gray-50 dark:focus:bg-dark-900 focus:border-brand-500" />
                                    <button type="button" onClick={() => { if (newFeatureInput.trim() && !newService.features.includes(newFeatureInput.trim())) { setNewService({ ...newService, features: [...newService.features, newFeatureInput.trim()] }); setNewFeatureInput(""); } }}
                                        className="rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-gray-900 dark:text-white hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors">Add</button>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={submittingService} className="rounded-xl bg-brand-500 active:scale-95 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 transition-all shadow-sm">
                                {submittingService ? "Saving..." : "Save Unit"}
                            </button>
                        </div>
                    </form>
                )}

                {/* Service list */}
                <div className="space-y-4">
                    {branch.services?.length === 0 ? (
                        <div className="text-center py-10 text-sm font-medium text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-dark-850">No units added yet.</div>
                    ) : (
                        branch.services?.map((svc: any) => (
                            <div key={svc.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-gray-50 dark:bg-dark-950 transition-all">
                                {editingServiceId === svc.id ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Name</label>
                                                <input type="text" value={editService.name} onChange={(e) => setEditService({ ...editService, name: e.target.value })}
                                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:bg-gray-50 dark:focus:bg-dark-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Unit Number</label>
                                                <input type="text" value={editService.unitNumber} onChange={(e) => setEditService({ ...editService, unitNumber: e.target.value })}
                                                    placeholder="e.g. R-101" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:bg-gray-50 dark:focus:bg-dark-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Pricing <span className="font-normal text-slate-500">(at least one required)</span></label>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Per Booking (JOD)</label>
                                                    <input type="number" step="0.001" min="0" value={editService.pricePerBooking} onChange={(e) => setEditService({ ...editService, pricePerBooking: e.target.value })}
                                                        placeholder="0.000" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Per Person (JOD)</label>
                                                    <input type="number" step="0.001" min="0" value={editService.pricePerPerson} onChange={(e) => setEditService({ ...editService, pricePerPerson: e.target.value })}
                                                        placeholder="0.000" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Per Hour (JOD)</label>
                                                    <input type="number" step="0.001" min="0" value={editService.pricePerHour} onChange={(e) => setEditService({ ...editService, pricePerHour: e.target.value })}
                                                        placeholder="0.000" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                                </div>
                                            </div>
                                        </div>
                                        {/* Extended fields */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Floor</label>
                                                <input type="text" value={editService.floor} onChange={(e) => setEditService({ ...editService, floor: e.target.value })}
                                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:bg-gray-50 dark:focus:bg-dark-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                            </div>
                                            {isSetupEligible(svc.type) && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Shape</label>
                                                <select value={editService.shape} onChange={(e) => setEditService({ ...editService, shape: e.target.value })}
                                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:bg-gray-50 dark:focus:bg-dark-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors">
                                                    {ROOM_SHAPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                </select>
                                            </div>
                                            )}
                                        </div>
                                        {/* Capacity — simple min/max for HOT_DESK / PRIVATE_OFFICE */}
                                        {isSimpleCapacity(svc.type) && (
                                        <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">Capacity</label>
                                            <div className="grid grid-cols-2 gap-4 max-w-xs">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Min People</label>
                                                    <input type="number" min="1" value={editService.minCapacity} onChange={(e) => setEditService({ ...editService, minCapacity: e.target.value })}
                                                        placeholder="1" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1">Max People</label>
                                                    <input type="number" min="1" value={editService.maxCapacity} onChange={(e) => setEditService({ ...editService, maxCapacity: e.target.value })}
                                                        placeholder="1" className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                                </div>
                                            </div>
                                        </div>
                                        )}
                                        {/* Setup Configurations — only for MEETING_ROOM / EVENT_SPACE */}
                                        {isSetupEligible(svc.type) && (
                                        <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Setup Configurations</label>
                                                <button type="button" onClick={() => setEditService({ ...editService, setupConfigs: [...editService.setupConfigs, { setupType: "CLASSROOM", minPeople: 1, maxPeople: 10 }] })}
                                                    className="rounded-lg bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-gray-900 dark:text-white hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors">+ Add Setup Configuration</button>
                                            </div>
                                            {editService.setupConfigs.map((sc, idx) => (
                                                <div key={idx} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 mb-2 items-end">
                                                    <div>
                                                        {idx === 0 && <label className="block text-xs font-bold text-slate-500 mb-1">Setup Type</label>}
                                                        <select value={sc.setupType} onChange={(e) => { const updated = [...editService.setupConfigs]; updated[idx] = { ...sc, setupType: e.target.value }; setEditService({ ...editService, setupConfigs: updated }); }}
                                                            className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors">
                                                            {SETUP_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        {idx === 0 && <label className="block text-xs font-bold text-slate-500 mb-1">Min People</label>}
                                                        <input type="number" min="1" value={sc.minPeople} onChange={(e) => { const updated = [...editService.setupConfigs]; updated[idx] = { ...sc, minPeople: parseInt(e.target.value) || 1 }; setEditService({ ...editService, setupConfigs: updated }); }}
                                                            className="block w-24 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                                    </div>
                                                    <div>
                                                        {idx === 0 && <label className="block text-xs font-bold text-slate-500 mb-1">Max People</label>}
                                                        <input type="number" min="1" value={sc.maxPeople} onChange={(e) => { const updated = [...editService.setupConfigs]; updated[idx] = { ...sc, maxPeople: parseInt(e.target.value) || 1 }; setEditService({ ...editService, setupConfigs: updated }); }}
                                                            className="block w-24 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                                    </div>
                                                    <button type="button" onClick={() => setEditService({ ...editService, setupConfigs: editService.setupConfigs.filter((_, i) => i !== idx) })}
                                                        className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-3 text-xs font-bold text-red-500 hover:bg-red-500/20 transition-colors">Remove</button>
                                                </div>
                                            ))}
                                            {editService.setupConfigs.length === 0 && <p className="text-xs font-medium text-slate-500 py-2">No setup configurations added.</p>}
                                        </div>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Weight</label>
                                                <input type="number" value={editService.weight} onChange={(e) => setEditService({ ...editService, weight: e.target.value })}
                                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:bg-gray-50 dark:focus:bg-dark-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Net Size (sqm)</label>
                                                <input type="number" step="0.01" value={editService.netSize} onChange={(e) => setEditService({ ...editService, netSize: e.target.value })}
                                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:bg-gray-50 dark:focus:bg-dark-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Profile Name (EN)</label>
                                                <input type="text" value={editService.profileNameEn} onChange={(e) => setEditService({ ...editService, profileNameEn: e.target.value })}
                                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:bg-gray-50 dark:focus:bg-dark-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Profile Name (AR)</label>
                                                <input type="text" value={editService.profileNameAr} onChange={(e) => setEditService({ ...editService, profileNameAr: e.target.value })}
                                                    className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:bg-gray-50 dark:focus:bg-dark-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Description</label>
                                            <textarea value={editService.description} onChange={(e) => setEditService({ ...editService, description: e.target.value })} rows={2}
                                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:bg-gray-50 dark:focus:bg-dark-850 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors resize-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Features</label>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {editService.features.map((f) => (
                                                    <span key={f} className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1 text-xs font-bold text-brand-400">
                                                        {f} <button type="button" onClick={() => setEditService({ ...editService, features: editService.features.filter(x => x !== f) })} className="text-brand-500/60 hover:text-brand-400">x</button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="text" value={editFeatureInput} onChange={(e) => setEditFeatureInput(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (editFeatureInput.trim() && !editService.features.includes(editFeatureInput.trim())) { setEditService({ ...editService, features: [...editService.features, editFeatureInput.trim()] }); setEditFeatureInput(""); } } }}
                                                    placeholder="Add feature..." className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-900 focus:bg-gray-50 dark:focus:bg-dark-850 focus:border-brand-500" />
                                                <button type="button" onClick={() => { if (editFeatureInput.trim() && !editService.features.includes(editFeatureInput.trim())) { setEditService({ ...editService, features: [...editService.features, editFeatureInput.trim()] }); setEditFeatureInput(""); } }}
                                                    className="rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-gray-900 dark:text-white hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors">Add</button>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 pt-2">
                                            <button onClick={() => setEditingServiceId(null)} className="rounded-xl px-5 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
                                            <button onClick={handleSaveEdit} disabled={savingEdit} className="rounded-xl px-6 py-2 text-sm font-bold text-white bg-brand-500 active:scale-95 hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm">
                                                {savingEdit ? "Saving..." : "Save"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center flex-wrap gap-2 mb-2">
                                                <span className="text-lg font-bold text-gray-900 dark:text-white">{svc.name}</span>
                                                {svc.unitNumber && <span className="rounded-md bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 tracking-wider">{svc.unitNumber}</span>}
                                                <span className="rounded-md bg-brand-500/10 border border-brand-500/20 px-2 py-1 text-[10px] font-bold text-brand-400 tracking-wider">{formatServiceType(svc.type || "")}</span>
                                            </div>
                                            {/* Setup Configs display — only for eligible types */}
                                            {isSetupEligible(svc.type) && svc.setupConfigs && svc.setupConfigs.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {svc.setupConfigs.map((sc: any, idx: number) => (
                                                        <span key={idx} className="inline-flex rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                                            {formatSetupType(sc.setupType)}: {sc.minPeople}-{sc.maxPeople}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (svc.minCapacity != null || svc.capacity != null) ? (
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                                                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
                                                        {svc.minCapacity != null && svc.capacity != null ? `${svc.minCapacity}–${svc.capacity} people` : svc.capacity != null ? `${svc.capacity} people` : ""}
                                                    </span>
                                                </div>
                                            ) : null}
                                            {/* Extended info chips */}
                                            {(svc.floor || svc.netSize != null || (svc.shape && isSetupEligible(svc.type))) && (
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {svc.floor && <span className="inline-flex rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">Floor: {svc.floor}</span>}
                                                    {svc.netSize != null && <span className="inline-flex rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">{svc.netSize} sqm</span>}
                                                    {svc.shape && isSetupEligible(svc.type) && <span className="inline-flex rounded-full bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">{formatRoomShape(svc.shape)}</span>}
                                                </div>
                                            )}
                                            {svc.description && <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{svc.description}</p>}
                                            {svc.features && svc.features.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {svc.features.map((f: string) => <span key={f} className="inline-flex rounded-full bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 text-[11px] font-bold text-brand-400">{f}</span>)}
                                                </div>
                                            )}
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-500 dark:text-slate-400 bg-gray-50 dark:bg-dark-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800/50 inline-flex">
                                                {svc.pricePerBooking != null && (
                                                    <span className="flex items-baseline gap-1">
                                                        <span className="text-gray-900 dark:text-white font-bold">{Number(svc.pricePerBooking).toFixed(3)} JOD</span>
                                                        <span className="text-xs text-slate-500">/booking</span>
                                                    </span>
                                                )}
                                                {svc.pricePerPerson != null && (
                                                    <span className="flex items-baseline gap-1">
                                                        <span className="text-gray-900 dark:text-white font-bold">{Number(svc.pricePerPerson).toFixed(3)} JOD</span>
                                                        <span className="text-xs text-slate-500">/person</span>
                                                    </span>
                                                )}
                                                {svc.pricePerHour != null && (
                                                    <span className="flex items-baseline gap-1">
                                                        <span className="text-gray-900 dark:text-white font-bold">{Number(svc.pricePerHour).toFixed(3)} JOD</span>
                                                        <span className="text-xs text-slate-500">/hr</span>
                                                    </span>
                                                )}
                                                {svc.pricePerBooking == null && svc.pricePerPerson == null && svc.pricePerHour == null && (
                                                    <span className="text-slate-500">{"\u2014"}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 shrink-0 sm:self-start">
                                            <button onClick={() => startEdit(svc)} className="rounded-lg bg-gray-50 dark:bg-dark-850 border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors">Edit</button>
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
                title="Delete Unit"
                message="Are you sure you want to delete this unit? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
}
