"use client";

import { useEffect, useState } from "react";
import {
    getVendorProfile, updateVendorProfile, requestVerification,
    addSignatory, updateSignatory as apiUpdateSignatory, deleteSignatory as apiDeleteSignatory,
    addCompanyContact, updateCompanyContact as apiUpdateCompanyContact, deleteCompanyContact as apiDeleteCompanyContact,
    addDepartmentContact, updateDepartmentContact as apiUpdateDepartmentContact, deleteDepartmentContact as apiDeleteDepartmentContact,
    addBankingInfo, updateBankingInfo as apiUpdateBankingInfo, deleteBankingInfo as apiDeleteBankingInfo,
} from "../../../lib/vendor";
import { VerifiedBadge } from "../../components/verified-badge";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "../../components/ui/toast-provider";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import StatusBadge from "../../components/ui/status-badge";
import type { VendorProfile, AuthorizedSignatory, CompanyContact, DepartmentContact, BankingInfo } from "../../../lib/types";

const SOCIAL_PLATFORMS = [
    { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
    { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
    { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/..." },
    { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/..." },
    { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@..." },
];

const DEPARTMENT_OPTIONS = [
    { value: "FINANCE", label: "Finance" }, { value: "LEGAL", label: "Legal" },
    { value: "OPERATIONS", label: "Operations" }, { value: "MARKETING", label: "Marketing" },
    { value: "HR", label: "HR" }, { value: "IT", label: "IT" },
    { value: "SALES", label: "Sales" }, { value: "CUSTOMER_SERVICE", label: "Customer Service" },
];

const inputCls = "block w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-dark-950 focus:bg-slate-50 dark:focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors";

export default function VendorProfilePage() {
    const { token } = useAuth();
    const { toast } = useToast();
    const [profile, setProfile] = useState<VendorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState({
        companyName: "", description: "", phone: "", website: "",
        companyLegalName: "", companyShortName: "", companyTradeName: "",
        companyNationalId: "", companyRegistrationNumber: "", companyRegistrationDate: "",
        companySalesTaxNumber: "", registeredInCountry: "", hasTaxExemption: false, companyDescription: "",
    });
    const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

    useEffect(() => { if (token) loadProfile(); }, [token]);

    const loadProfile = () => {
        setLoading(true);
        getVendorProfile(token!)
            .then((data) => {
                setProfile(data);
                setForm({
                    companyName: data.companyName || "",
                    description: data.description || "",
                    phone: data.phone || "",
                    website: data.website || "",
                    companyLegalName: data.companyLegalName || "",
                    companyShortName: data.companyShortName || "",
                    companyTradeName: data.companyTradeName || "",
                    companyNationalId: data.companyNationalId || "",
                    companyRegistrationNumber: data.companyRegistrationNumber || "",
                    companyRegistrationDate: data.companyRegistrationDate ? data.companyRegistrationDate.split("T")[0] || "" : "",
                    companySalesTaxNumber: data.companySalesTaxNumber || "",
                    registeredInCountry: data.registeredInCountry || "",
                    hasTaxExemption: data.hasTaxExemption || false,
                    companyDescription: data.companyDescription || "",
                });
                setSocialLinks(data.socialLinks || {});
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccess(false);
        try {
            const updated = await updateVendorProfile(token!, { ...form, socialLinks } as any);
            setProfile(prev => prev ? { ...prev, ...updated } : prev);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch { toast("Failed to update profile.", "error"); }
        setSaving(false);
    };

    const [verifyConfirmOpen, setVerifyConfirmOpen] = useState(false);

    const handleRequestVerification = async () => {
        try {
            await requestVerification(token!);
            toast("Verification request submitted!", "success");
        } catch { toast("Failed to submit request.", "error"); }
        setVerifyConfirmOpen(false);
    };

    // ==================== SUB-MODEL CRUD ====================
    const [subSaving, setSubSaving] = useState(false);

    const handleAddSignatory = async () => {
        setSubSaving(true);
        try {
            const s = await addSignatory(token!, { fullName: "New Signatory" });
            setProfile(prev => prev ? { ...prev, authorizedSignatories: [...prev.authorizedSignatories, s] } : prev);
            toast("Signatory added", "success");
        } catch { toast("Failed to add signatory", "error"); }
        setSubSaving(false);
    };
    const handleUpdateSignatory = async (id: string, data: Record<string, unknown>) => {
        try {
            const s = await apiUpdateSignatory(token!, id, data);
            setProfile(prev => prev ? { ...prev, authorizedSignatories: prev.authorizedSignatories.map(x => x.id === id ? s : x) } : prev);
            toast("Signatory updated", "success");
        } catch { toast("Failed to update", "error"); }
    };
    const handleDeleteSignatory = async (id: string) => {
        try {
            await apiDeleteSignatory(token!, id);
            setProfile(prev => prev ? { ...prev, authorizedSignatories: prev.authorizedSignatories.filter(x => x.id !== id) } : prev);
            toast("Signatory deleted", "success");
        } catch { toast("Failed to delete", "error"); }
    };

    const handleAddCompanyContact = async () => {
        setSubSaving(true);
        try {
            const c = await addCompanyContact(token!, { contactPersonName: "New Contact" });
            setProfile(prev => prev ? { ...prev, companyContacts: [...prev.companyContacts, c] } : prev);
            toast("Contact added", "success");
        } catch { toast("Failed to add contact", "error"); }
        setSubSaving(false);
    };
    const handleUpdateCompanyContact = async (id: string, data: Record<string, unknown>) => {
        try {
            const c = await apiUpdateCompanyContact(token!, id, data);
            setProfile(prev => prev ? { ...prev, companyContacts: prev.companyContacts.map(x => x.id === id ? c : x) } : prev);
            toast("Contact updated", "success");
        } catch { toast("Failed to update", "error"); }
    };
    const handleDeleteCompanyContact = async (id: string) => {
        try {
            await apiDeleteCompanyContact(token!, id);
            setProfile(prev => prev ? { ...prev, companyContacts: prev.companyContacts.filter(x => x.id !== id) } : prev);
            toast("Contact deleted", "success");
        } catch { toast("Failed to delete", "error"); }
    };

    const handleAddDeptContact = async () => {
        setSubSaving(true);
        try {
            const d = await addDepartmentContact(token!, { department: "SALES", contactName: "New Contact" });
            setProfile(prev => prev ? { ...prev, departmentContacts: [...prev.departmentContacts, d] } : prev);
            toast("Department contact added", "success");
        } catch { toast("Failed to add", "error"); }
        setSubSaving(false);
    };
    const handleUpdateDeptContact = async (id: string, data: Record<string, unknown>) => {
        try {
            const d = await apiUpdateDepartmentContact(token!, id, data);
            setProfile(prev => prev ? { ...prev, departmentContacts: prev.departmentContacts.map(x => x.id === id ? d : x) } : prev);
            toast("Updated", "success");
        } catch { toast("Failed to update", "error"); }
    };
    const handleDeleteDeptContact = async (id: string) => {
        try {
            await apiDeleteDepartmentContact(token!, id);
            setProfile(prev => prev ? { ...prev, departmentContacts: prev.departmentContacts.filter(x => x.id !== id) } : prev);
            toast("Deleted", "success");
        } catch { toast("Failed to delete", "error"); }
    };

    const handleAddBankingInfo = async () => {
        setSubSaving(true);
        try {
            const b = await addBankingInfo(token!, { bankName: "New Bank", accountNumber: "000000" });
            setProfile(prev => prev ? { ...prev, bankingInfo: [...prev.bankingInfo, b] } : prev);
            toast("Bank account added", "success");
        } catch { toast("Failed to add", "error"); }
        setSubSaving(false);
    };
    const handleUpdateBankingInfo = async (id: string, data: Record<string, unknown>) => {
        try {
            const b = await apiUpdateBankingInfo(token!, id, data);
            setProfile(prev => prev ? { ...prev, bankingInfo: prev.bankingInfo.map(x => x.id === id ? b : x) } : prev);
            toast("Updated", "success");
        } catch { toast("Failed to update", "error"); }
    };
    const handleDeleteBankingInfo = async (id: string) => {
        try {
            await apiDeleteBankingInfo(token!, id);
            setProfile(prev => prev ? { ...prev, bankingInfo: prev.bankingInfo.filter(x => x.id !== id) } : prev);
            toast("Deleted", "success");
        } catch { toast("Failed to delete", "error"); }
    };

    if (loading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Company Profile</h1>
                    {profile?.isVerified ? (
                        <div className="flex items-center gap-1 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 text-sm font-bold text-brand-400 shadow-sm">
                            <VerifiedBadge size="sm" /> Verified
                        </div>
                    ) : profile?.verificationRequestedAt ? (
                        <div className="rounded-full bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 text-xs font-bold text-yellow-500">
                            Verification Pending
                        </div>
                    ) : (
                        <button onClick={() => setVerifyConfirmOpen(true)} className="rounded-full bg-white dark:bg-dark-800 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700">
                            Request Verification
                        </button>
                    )}
                </div>
                <StatusBadge status={profile?.status || ""} size="md" />
            </div>

            {success && <div className="rounded-2xl bg-green-500/10 p-4 text-sm font-bold text-green-400 border border-green-500/20">Profile updated successfully!</div>}

            {/* Company Details */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company Details</h2>
                <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Company Name</label>
                    <input type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className={inputCls} />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Description</label>
                    <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Phone</label>
                        <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Website</label>
                        <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputCls} />
                    </div>
                </div>
            </div>

            {/* Company Legal Information */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company Legal Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Legal Name</label>
                        <input type="text" value={form.companyLegalName} onChange={(e) => setForm({ ...form, companyLegalName: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Short Name</label>
                        <input type="text" value={form.companyShortName} onChange={(e) => setForm({ ...form, companyShortName: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Trade Name</label>
                        <input type="text" value={form.companyTradeName} onChange={(e) => setForm({ ...form, companyTradeName: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">National ID</label>
                        <input type="text" value={form.companyNationalId} onChange={(e) => setForm({ ...form, companyNationalId: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Registration Number</label>
                        <input type="text" value={form.companyRegistrationNumber} onChange={(e) => setForm({ ...form, companyRegistrationNumber: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Registration Date</label>
                        <input type="date" value={form.companyRegistrationDate} onChange={(e) => setForm({ ...form, companyRegistrationDate: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Sales Tax Number</label>
                        <input type="text" value={form.companySalesTaxNumber} onChange={(e) => setForm({ ...form, companySalesTaxNumber: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Registered Country</label>
                        <input type="text" value={form.registeredInCountry} onChange={(e) => setForm({ ...form, registeredInCountry: e.target.value })} className={inputCls} />
                    </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.hasTaxExemption} onChange={(e) => setForm({ ...form, hasTaxExemption: e.target.checked })}
                        className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-brand-500 focus:ring-brand-500 bg-white dark:bg-dark-950" />
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Tax Exempt</span>
                </label>
                <div>
                    <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Company Description</label>
                    <textarea rows={3} value={form.companyDescription} onChange={(e) => setForm({ ...form, companyDescription: e.target.value })} className={inputCls} />
                </div>
            </div>

            {/* Social Media */}
            <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Social Media</h2>
                {SOCIAL_PLATFORMS.map((p) => (
                    <div key={p.key} className="flex items-center gap-4">
                        <span className="w-32 text-sm font-bold text-slate-600 dark:text-slate-300">{p.label}</span>
                        <input type="url" placeholder={p.placeholder}
                            value={socialLinks[p.key] || ""}
                            onChange={(e) => setSocialLinks({ ...socialLinks, [p.key]: e.target.value })}
                            className={`flex-1 ${inputCls} placeholder-slate-600`} />
                    </div>
                ))}
            </div>

            <div className="flex justify-end pt-2">
                <button onClick={handleSave} disabled={saving}
                    className="rounded-xl bg-brand-500 active:scale-95 px-8 py-3.5 text-sm font-bold text-white hover:bg-brand-600 hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(255,91,4,0.3)] transition-all disabled:opacity-50 disabled:hover:translate-y-0">
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            {/* ==================== AUTHORIZED SIGNATORIES ==================== */}
            <SubModelSection<AuthorizedSignatory>
                title="Authorized Signatories"
                items={profile?.authorizedSignatories || []}
                onAdd={handleAddSignatory}
                onUpdate={handleUpdateSignatory}
                onDelete={handleDeleteSignatory}
                addingDisabled={subSaving}
                renderItem={(item) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div><span className="font-bold text-slate-500">Name:</span> <span className="text-gray-900 dark:text-white ml-1">{item.fullName}</span></div>
                        {item.email && <div><span className="font-bold text-slate-500">Email:</span> <span className="text-gray-900 dark:text-white ml-1">{item.email}</span></div>}
                        {item.mobile && <div><span className="font-bold text-slate-500">Mobile:</span> <span className="text-gray-900 dark:text-white ml-1">{item.mobile}</span></div>}
                        {item.nationality && <div><span className="font-bold text-slate-500">Nationality:</span> <span className="text-gray-900 dark:text-white ml-1">{item.nationality}</span></div>}
                    </div>
                )}
                editFields={[
                    { key: "fullName", label: "Full Name", required: true },
                    { key: "nationality", label: "Nationality" },
                    { key: "mobile", label: "Mobile" },
                    { key: "email", label: "Email" },
                ]}
            />

            {/* ==================== COMPANY CONTACTS ==================== */}
            <SubModelSection<CompanyContact>
                title="Company Contacts"
                items={profile?.companyContacts || []}
                onAdd={handleAddCompanyContact}
                onUpdate={handleUpdateCompanyContact}
                onDelete={handleDeleteCompanyContact}
                addingDisabled={subSaving}
                renderItem={(item) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div><span className="font-bold text-slate-500">Person:</span> <span className="text-gray-900 dark:text-white ml-1">{item.contactPersonName}</span></div>
                        {item.email && <div><span className="font-bold text-slate-500">Email:</span> <span className="text-gray-900 dark:text-white ml-1">{item.email}</span></div>}
                        {item.mobile && <div><span className="font-bold text-slate-500">Mobile:</span> <span className="text-gray-900 dark:text-white ml-1">{item.mobile}</span></div>}
                        {item.phone && <div><span className="font-bold text-slate-500">Phone:</span> <span className="text-gray-900 dark:text-white ml-1">{item.phone}</span></div>}
                    </div>
                )}
                editFields={[
                    { key: "contactPersonName", label: "Contact Person", required: true },
                    { key: "mobile", label: "Mobile" },
                    { key: "email", label: "Email" },
                    { key: "phone", label: "Phone" },
                    { key: "website", label: "Website" },
                    { key: "fax", label: "Fax" },
                ]}
            />

            {/* ==================== DEPARTMENT CONTACTS ==================== */}
            <SubModelSection<DepartmentContact>
                title="Department Contacts"
                items={profile?.departmentContacts || []}
                onAdd={handleAddDeptContact}
                onUpdate={handleUpdateDeptContact}
                onDelete={handleDeleteDeptContact}
                addingDisabled={subSaving}
                renderItem={(item) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div><span className="font-bold text-slate-500">Dept:</span> <span className="text-gray-900 dark:text-white ml-1">{item.department}</span></div>
                        <div><span className="font-bold text-slate-500">Contact:</span> <span className="text-gray-900 dark:text-white ml-1">{item.contactName}</span></div>
                        {item.email && <div><span className="font-bold text-slate-500">Email:</span> <span className="text-gray-900 dark:text-white ml-1">{item.email}</span></div>}
                        {item.mobile && <div><span className="font-bold text-slate-500">Mobile:</span> <span className="text-gray-900 dark:text-white ml-1">{item.mobile}</span></div>}
                    </div>
                )}
                editFields={[
                    { key: "contactName", label: "Contact Name", required: true },
                    { key: "mobile", label: "Mobile" },
                    { key: "phone", label: "Phone" },
                    { key: "email", label: "Email" },
                    { key: "fax", label: "Fax" },
                ]}
            />

            {/* ==================== BANKING INFORMATION ==================== */}
            <SubModelSection<BankingInfo>
                title="Banking Information"
                items={profile?.bankingInfo || []}
                onAdd={handleAddBankingInfo}
                onUpdate={handleUpdateBankingInfo}
                onDelete={handleDeleteBankingInfo}
                addingDisabled={subSaving}
                renderItem={(item) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div><span className="font-bold text-slate-500">Bank:</span> <span className="text-gray-900 dark:text-white ml-1">{item.bankName}</span></div>
                        {item.accountNumber && <div><span className="font-bold text-slate-500">Account:</span> <span className="text-gray-900 dark:text-white ml-1">****{item.accountNumber.slice(-4)}</span></div>}
                        {item.iban && <div><span className="font-bold text-slate-500">IBAN:</span> <span className="text-gray-900 dark:text-white ml-1">{item.iban}</span></div>}
                        {item.cliq && <div><span className="font-bold text-slate-500">CliQ:</span> <span className="text-gray-900 dark:text-white ml-1">{item.cliq}</span></div>}
                    </div>
                )}
                editFields={[
                    { key: "bankName", label: "Bank Name", required: true },
                    { key: "bankBranch", label: "Branch" },
                    { key: "accountNumber", label: "Account Number", required: true },
                    { key: "iban", label: "IBAN" },
                    { key: "swiftCode", label: "SWIFT Code" },
                    { key: "cliq", label: "CliQ Alias" },
                    { key: "accountantManagerName", label: "Accountant Manager" },
                ]}
            />

            <div className="rounded-2xl bg-brand-500/10 border border-brand-500/20 p-5 text-sm text-brand-400 font-medium">
                <strong>Amenities</strong> are now managed per branch. Go to each branch detail page to set the facilities for that specific location.
            </div>

            <ConfirmDialog
                isOpen={verifyConfirmOpen}
                onClose={() => setVerifyConfirmOpen(false)}
                onConfirm={handleRequestVerification}
                title="Request Verification"
                message="Request a verification badge? Admin will review your profile."
                confirmLabel="Request Verification"
                variant="default"
            />
        </div>
    );
}

// ==================== REUSABLE SUB-MODEL SECTION ====================

interface EditField { key: string; label: string; required?: boolean; }

interface SubModelSectionProps<T extends { id: string }> {
    title: string;
    items: T[];
    onAdd: () => void;
    onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    addingDisabled: boolean;
    renderItem: (item: T) => React.ReactNode;
    editFields: EditField[];
}

function SubModelSection<T extends { id: string }>({
    title, items, onAdd, onUpdate, onDelete, addingDisabled, renderItem, editFields,
}: SubModelSectionProps<T>) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Record<string, string>>({});
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const startEdit = (item: T) => {
        const formData: Record<string, string> = {};
        editFields.forEach(f => { formData[f.key] = (item as any)[f.key] || ""; });
        setEditForm(formData);
        setEditingId(item.id);
    };

    const saveEdit = async () => {
        if (!editingId) return;
        const data: Record<string, unknown> = {};
        editFields.forEach(f => {
            if (editForm[f.key] !== undefined) data[f.key] = editForm[f.key] || undefined;
        });
        await onUpdate(editingId, data);
        setEditingId(null);
    };

    return (
        <div className="rounded-2xl bg-white dark:bg-dark-900 p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title} ({items.length})</h2>
                <button onClick={onAdd} disabled={addingDisabled}
                    className="rounded-lg bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 text-xs font-bold text-brand-400 hover:bg-brand-500/20 transition-colors disabled:opacity-50">
                    + Add
                </button>
            </div>

            {items.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No records yet. Click &quot;+ Add&quot; to create one.</p>
            )}

            {items.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-dark-950 p-4">
                    {editingId === item.id ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {editFields.map(f => (
                                    <div key={f.key}>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">
                                            {f.label} {f.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <input type="text" value={editForm[f.key] || ""}
                                            onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                                            className={inputCls} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => setEditingId(null)}
                                    className="rounded-lg px-4 py-2 text-xs font-bold text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
                                <button onClick={saveEdit}
                                    className="rounded-lg bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 transition-colors">Save</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">{renderItem(item)}</div>
                            <div className="flex gap-1 shrink-0">
                                <button onClick={() => startEdit(item)}
                                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors">Edit</button>
                                <button onClick={() => setConfirmDeleteId(item.id)}
                                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">Delete</button>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {confirmDeleteId && (
                <ConfirmDialog
                    isOpen={true}
                    onClose={() => setConfirmDeleteId(null)}
                    onConfirm={async () => { await onDelete(confirmDeleteId); setConfirmDeleteId(null); }}
                    title="Confirm Deletion"
                    message="Are you sure you want to delete this record?"
                    confirmLabel="Delete"
                    variant="danger"
                />
            )}
        </div>
    );
}
