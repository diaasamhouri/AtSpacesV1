"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { VENDOR_TERMS_CONTENT } from "./terms-content";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ==================== CATEGORIZED AMENITIES ====================
const AMENITY_CATEGORIES: { label: string; items: string[] }[] = [
  {
    label: "General Standards",
    items: [
      "Parking", "Elevator / Ramps", "Fire Exits", "Smoke Detectors",
      "CCTV / Security", "Emergency Lighting", "High-Speed WiFi (50+ Mbps)",
      "Daily Cleaning", "Ergonomic Furniture", "Projector / TV Screen",
      "Whiteboard", "Power Outlets",
    ],
  },
  {
    label: "Meeting Room",
    items: ["Conference Phone", "Display Screen", "HDMI Cables", "Soundproofing", "Lockable Doors", "Adjustable Lighting"],
  },
  {
    label: "Office Space",
    items: ["Desks", "Ergonomic Chairs", "Cabinets / Storage", "Pantry / Restrooms", "24/7 Access", "Reception / Front Desk", "Mail Handling"],
  },
  {
    label: "Event Space",
    items: ["Sound System", "Microphone", "Flexible Setup (Theater / Classroom / Banquet)", "Fire Extinguishers", "Evacuation Plan"],
  },
  {
    label: "Coffee & Catering",
    items: ["Water Dispenser (Hot & Cold)", "Coffee Machine", "Tea Station", "Cups (Eco-Friendly)", "Sugar & Sweeteners", "Milk / Cream", "Napkins & Trays", "Light Snacks"],
  },
  {
    label: "Technology & Equipment",
    items: ["Video Conferencing System", "Wireless Presentation (AirPlay / Chromecast)", "USB-C / HDMI Adapters", "Charging Stations (USB / Type-C / Wireless)", "Smart Room Controls", "Digital Booking Panel"],
  },
  {
    label: "Comfort & Accessibility",
    items: ["Air Conditioning", "Ventilation / Fresh Air", "Wheelchair Accessible", "Multi-Language Signage", "First Aid Kit"],
  },
];

const DEPARTMENT_OPTIONS = [
  { value: "FINANCE", label: "Finance" },
  { value: "LEGAL", label: "Legal" },
  { value: "OPERATIONS", label: "Operations" },
  { value: "MARKETING", label: "Marketing" },
  { value: "HR", label: "HR" },
  { value: "IT", label: "IT" },
  { value: "SALES", label: "Sales" },
  { value: "CUSTOMER_SERVICE", label: "Customer Service" },
];

const LEGAL_DOC_TYPES = [
  { value: "NATIONAL_ID", label: "National ID" },
  { value: "PASSPORT", label: "Passport" },
];

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
];

// Shared input class
const inputCls = "block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-950 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500";
const selectCls = inputCls;

interface SignatoryForm { fullName: string; nationality: string; legalDocType: string; legalDocNumber: string; mobile: string; email: string; gender: string; }
interface CompanyContactForm { contactPersonName: string; mobile: string; email: string; website: string; phone: string; fax: string; }
interface DepartmentContactForm { department: string; contactName: string; mobile: string; phone: string; email: string; fax: string; }
interface BankingForm { bankName: string; bankBranch: string; accountNumber: string; iban: string; swiftCode: string; accountantManagerName: string; cliq: string; }

const emptySignatory = (): SignatoryForm => ({ fullName: "", nationality: "", legalDocType: "", legalDocNumber: "", mobile: "", email: "", gender: "" });
const emptyCompanyContact = (): CompanyContactForm => ({ contactPersonName: "", mobile: "", email: "", website: "", phone: "", fax: "" });
const emptyDeptContact = (): DepartmentContactForm => ({ department: "SALES", contactName: "", mobile: "", phone: "", email: "", fax: "" });
const emptyBanking = (): BankingForm => ({ bankName: "", bankBranch: "", accountNumber: "", iban: "", swiftCode: "", accountantManagerName: "", cliq: "" });

export default function VendorApplicationPage() {
  const { user, token, isLoading, login } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const totalSteps = 9;

  // Step 1 — Business Details (expanded)
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [companyLegalName, setCompanyLegalName] = useState("");
  const [companyNationalId, setCompanyNationalId] = useState("");
  const [companyRegistrationNumber, setCompanyRegistrationNumber] = useState("");

  // Step 2 — Company Legal Info
  const [companyShortName, setCompanyShortName] = useState("");
  const [companyTradeName, setCompanyTradeName] = useState("");
  const [companyRegistrationDate, setCompanyRegistrationDate] = useState("");
  const [companySalesTaxNumber, setCompanySalesTaxNumber] = useState("");
  const [registeredInCountry, setRegisteredInCountry] = useState("Jordan");
  const [hasTaxExemption, setHasTaxExemption] = useState(false);
  const [companyDescription, setCompanyDescription] = useState("");

  // Step 3 — Authorized Signatories
  const [signatories, setSignatories] = useState<SignatoryForm[]>([emptySignatory()]);

  // Step 4 — Company Contacts
  const [companyContacts, setCompanyContacts] = useState<CompanyContactForm[]>([emptyCompanyContact()]);

  // Step 5 — Department Contacts
  const [departmentContacts, setDepartmentContacts] = useState<DepartmentContactForm[]>([]);

  // Step 6 — Banking Information
  const [bankingInfo, setBankingInfo] = useState<BankingForm[]>([emptyBanking()]);

  // Step 7 — Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["General Standards"]);

  // Step 8 — Images & Terms
  const [images, setImages] = useState<{ file: File; preview: string; url?: string }[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // General
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login?redirect=/become-vendor");
    }
    if (user?.role === "VENDOR") {
      router.push("/vendor");
    }
  }, [user, isLoading, router]);

  // ==================== AMENITY LOGIC ====================
  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const toggleCategory = (label: string) => {
    setExpandedCategories((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  };

  const addCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (trimmed && !selectedAmenities.includes(trimmed)) {
      setSelectedAmenities((prev) => [...prev, trimmed]);
      setCustomAmenity("");
    }
  };

  // ==================== IMAGE LOGIC ====================
  const handleImageSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    setUploadError("");

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setUploadError("Only image files are allowed.");
        return;
      }
      const img = new Image();
      img.onload = () => {
        if (img.width <= img.height) {
          setUploadError("Please upload landscape (horizontal) images only. Width must be greater than height.");
          URL.revokeObjectURL(img.src);
          return;
        }
        setImages((prev) => [...prev, { file, preview: URL.createObjectURL(file) }]);
      };
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const removeImage = (index: number) => {
    setImages((prev) => {
      const item = prev[index];
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadAllImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const img of images) {
      if (img.url) { urls.push(img.url); continue; }
      const formData = new FormData();
      formData.append("file", img.file);
      const res = await fetch(`${API}/uploads`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();
      img.url = data.url;
      urls.push(data.url);
    }
    return urls;
  };

  // ==================== DYNAMIC ARRAY HELPERS ====================
  const updateSignatory = (idx: number, field: keyof SignatoryForm, value: string) => {
    setSignatories(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };
  const updateCompanyContact = (idx: number, field: keyof CompanyContactForm, value: string) => {
    setCompanyContacts(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };
  const updateDeptContact = (idx: number, field: keyof DepartmentContactForm, value: string) => {
    setDepartmentContacts(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };
  const updateBankingInfo = (idx: number, field: keyof BankingForm, value: string) => {
    setBankingInfo(prev => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b));
  };

  // ==================== SUBMIT ====================
  const handleSubmit = async () => {
    if (!token) return;
    setIsSubmitting(true);
    setError("");
    try {
      const imageUrls = await uploadAllImages();
      const payload = {
        companyName,
        description: description || undefined,
        phone: phone || undefined,
        website: website || undefined,
        images: imageUrls,
        amenities: selectedAmenities,
        agreedToTermsAt: new Date().toISOString(),
        companyLegalName,
        companyShortName: companyShortName || undefined,
        companyTradeName: companyTradeName || undefined,
        companyNationalId,
        companyRegistrationNumber,
        companyRegistrationDate: companyRegistrationDate || undefined,
        companySalesTaxNumber: companySalesTaxNumber || undefined,
        registeredInCountry: registeredInCountry || undefined,
        hasTaxExemption,
        companyDescription: companyDescription || undefined,
        authorizedSignatories: signatories.map(s => ({
          fullName: s.fullName,
          nationality: s.nationality || undefined,
          legalDocType: s.legalDocType || undefined,
          legalDocNumber: s.legalDocNumber || undefined,
          mobile: s.mobile || undefined,
          email: s.email || undefined,
          gender: s.gender || undefined,
        })),
        companyContacts: companyContacts.map(c => ({
          contactPersonName: c.contactPersonName,
          mobile: c.mobile || undefined,
          email: c.email || undefined,
          website: c.website || undefined,
          phone: c.phone || undefined,
          fax: c.fax || undefined,
        })),
        departmentContacts: departmentContacts.length > 0
          ? departmentContacts.map(d => ({
            department: d.department,
            contactName: d.contactName,
            mobile: d.mobile || undefined,
            phone: d.phone || undefined,
            email: d.email || undefined,
            fax: d.fax || undefined,
          }))
          : undefined,
        bankingInfo: bankingInfo.map(b => ({
          bankName: b.bankName,
          bankBranch: b.bankBranch || undefined,
          accountNumber: b.accountNumber,
          iban: b.iban || undefined,
          swiftCode: b.swiftCode || undefined,
          accountantManagerName: b.accountantManagerName || undefined,
          cliq: b.cliq || undefined,
        })),
      };

      const res = await fetch(`${API}/auth/become-vendor`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to submit application");
      }
      if (token) await login(token);
      router.push("/vendor");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== GUARDS ====================
  if (isLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const canNext = () => {
    if (step === 1) return companyName.trim().length > 0 && companyLegalName.trim().length > 0 && companyNationalId.trim().length > 0 && companyRegistrationNumber.trim().length > 0;
    if (step === 2) return true; // all optional
    if (step === 3) return signatories.length > 0 && signatories.every(s => s.fullName.trim().length > 0);
    if (step === 4) return companyContacts.length > 0 && companyContacts.every(c => c.contactPersonName.trim().length > 0);
    if (step === 5) return true; // optional
    if (step === 6) return bankingInfo.length > 0 && bankingInfo.every(b => b.bankName.trim().length > 0 && b.accountNumber.trim().length > 0);
    if (step === 7) return selectedAmenities.length > 0;
    if (step === 8) return images.length > 0 && agreedToTerms;
    return true;
  };

  const STEP_LABELS = ["Business", "Legal", "Signatories", "Contacts", "Departments", "Banking", "Amenities", "Images", "Review"];

  // ==================== RENDER ====================
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 mt-8">
      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-2">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex flex-col items-center flex-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${i + 1 <= step
                  ? "bg-brand-500 text-white shadow-[0_4px_12px_rgba(255,91,4,0.3)]"
                  : "bg-white dark:bg-dark-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                  }`}
              >
                {i + 1 < step ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`mt-1.5 text-[10px] font-bold uppercase tracking-wider ${i + 1 <= step ? "text-brand-500" : "text-slate-500"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="relative h-1.5 rounded-full bg-slate-200 dark:bg-dark-800 mt-2">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 shadow-[0_0_10px_rgba(255,100,0,0.5)] transition-all duration-500"
            style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-[2rem] bg-white dark:bg-dark-900 p-8 sm:p-10 shadow-float border border-slate-200 dark:border-slate-800">
        {error && (
          <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm font-medium text-red-500 border border-red-500/20">{error}</div>
        )}

        {/* ===== STEP 1: Business Details ===== */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Business Details</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tell us about your company.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Company / Venue Name <span className="text-red-500">*</span></label>
              <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputCls} placeholder="e.g. The Hive Coworking" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Company Legal Name <span className="text-red-500">*</span></label>
              <input type="text" required value={companyLegalName} onChange={(e) => setCompanyLegalName(e.target.value)} className={inputCls} placeholder="Official registered company name" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Company National ID <span className="text-red-500">*</span></label>
                <input type="text" required value={companyNationalId} onChange={(e) => setCompanyNationalId(e.target.value)} className={inputCls} placeholder="National company ID" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Registration Number <span className="text-red-500">*</span></label>
                <input type="text" required value={companyRegistrationNumber} onChange={(e) => setCompanyRegistrationNumber(e.target.value)} className={inputCls} placeholder="Company reg. number" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Description</label>
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} placeholder="What makes your space unique?" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Phone</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+962 7X XXX XXXX" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Website</label>
                <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="https://yourcompany.com" />
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 2: Company Legal Info ===== */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Company Legal Info</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Additional legal and tax details (optional).</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Short Name</label>
                <input type="text" value={companyShortName} onChange={(e) => setCompanyShortName(e.target.value)} className={inputCls} placeholder="Abbreviated name" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Trade Name</label>
                <input type="text" value={companyTradeName} onChange={(e) => setCompanyTradeName(e.target.value)} className={inputCls} placeholder="Trading as..." />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Registration Date</label>
                <input type="date" value={companyRegistrationDate} onChange={(e) => setCompanyRegistrationDate(e.target.value)} className={inputCls} max={new Date().toISOString().split("T")[0]} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Sales Tax Number</label>
                <input type="text" value={companySalesTaxNumber} onChange={(e) => setCompanySalesTaxNumber(e.target.value)} className={inputCls} placeholder="Tax number" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Registered Country</label>
                <input type="text" value={registeredInCountry} onChange={(e) => setRegisteredInCountry(e.target.value)} className={inputCls} placeholder="Jordan" />
              </div>
              <div className="flex items-center pt-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={hasTaxExemption} onChange={(e) => setHasTaxExemption(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-brand-500 focus:ring-brand-500 bg-white dark:bg-dark-950" />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Tax Exempt</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Company Description</label>
              <textarea rows={3} value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} className={inputCls} placeholder="Additional company details..." />
            </div>
          </div>
        )}

        {/* ===== STEP 3: Authorized Signatories ===== */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Authorized Signatories</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Add at least one authorized signatory.</p>
            </div>
            {signatories.map((s, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Signatory {idx + 1}</h3>
                  {signatories.length > 1 && (
                    <button type="button" onClick={() => setSignatories(prev => prev.filter((_, i) => i !== idx))}
                      className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input type="text" value={s.fullName} onChange={(e) => updateSignatory(idx, "fullName", e.target.value)} className={inputCls} placeholder="Full legal name" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Nationality</label>
                    <input type="text" value={s.nationality} onChange={(e) => updateSignatory(idx, "nationality", e.target.value)} className={inputCls} placeholder="e.g. Jordanian" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Document Type</label>
                    <select value={s.legalDocType} onChange={(e) => updateSignatory(idx, "legalDocType", e.target.value)} className={selectCls}>
                      <option value="">Select...</option>
                      {LEGAL_DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Document Number</label>
                    <input type="text" value={s.legalDocNumber} onChange={(e) => updateSignatory(idx, "legalDocNumber", e.target.value)} className={inputCls} placeholder="ID / Passport number" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Mobile</label>
                    <input type="tel" value={s.mobile} onChange={(e) => updateSignatory(idx, "mobile", e.target.value)} className={inputCls} placeholder="+962 7X..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                    <input type="email" value={s.email} onChange={(e) => updateSignatory(idx, "email", e.target.value)} className={inputCls} placeholder="email@company.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Gender</label>
                    <select value={s.gender} onChange={(e) => updateSignatory(idx, "gender", e.target.value)} className={selectCls}>
                      <option value="">Select...</option>
                      {GENDER_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setSignatories(prev => [...prev, emptySignatory()])}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:border-brand-500 hover:text-brand-400 transition-colors">
              + Add Signatory
            </button>
          </div>
        )}

        {/* ===== STEP 4: Company Contacts ===== */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Company Contacts</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Add at least one company contact person.</p>
            </div>
            {companyContacts.map((c, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Contact {idx + 1}</h3>
                  {companyContacts.length > 1 && (
                    <button type="button" onClick={() => setCompanyContacts(prev => prev.filter((_, i) => i !== idx))}
                      className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Contact Person <span className="text-red-500">*</span></label>
                    <input type="text" value={c.contactPersonName} onChange={(e) => updateCompanyContact(idx, "contactPersonName", e.target.value)} className={inputCls} placeholder="Full name" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Mobile</label>
                    <input type="tel" value={c.mobile} onChange={(e) => updateCompanyContact(idx, "mobile", e.target.value)} className={inputCls} placeholder="+962 7X..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                    <input type="email" value={c.email} onChange={(e) => updateCompanyContact(idx, "email", e.target.value)} className={inputCls} placeholder="email@company.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                    <input type="tel" value={c.phone} onChange={(e) => updateCompanyContact(idx, "phone", e.target.value)} className={inputCls} placeholder="Office phone" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Website</label>
                    <input type="url" value={c.website} onChange={(e) => updateCompanyContact(idx, "website", e.target.value)} className={inputCls} placeholder="https://..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Fax</label>
                    <input type="text" value={c.fax} onChange={(e) => updateCompanyContact(idx, "fax", e.target.value)} className={inputCls} placeholder="Fax number" />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setCompanyContacts(prev => [...prev, emptyCompanyContact()])}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:border-brand-500 hover:text-brand-400 transition-colors">
              + Add Contact
            </button>
          </div>
        )}

        {/* ===== STEP 5: Department Contacts ===== */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Department Contacts</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Optional: add department-level contacts.</p>
            </div>
            {departmentContacts.map((d, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Department {idx + 1}</h3>
                  <button type="button" onClick={() => setDepartmentContacts(prev => prev.filter((_, i) => i !== idx))}
                    className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors">Remove</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Department <span className="text-red-500">*</span></label>
                    <select value={d.department} onChange={(e) => updateDeptContact(idx, "department", e.target.value)} className={selectCls}>
                      {DEPARTMENT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Contact Name <span className="text-red-500">*</span></label>
                    <input type="text" value={d.contactName} onChange={(e) => updateDeptContact(idx, "contactName", e.target.value)} className={inputCls} placeholder="Full name" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Mobile</label>
                    <input type="tel" value={d.mobile} onChange={(e) => updateDeptContact(idx, "mobile", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                    <input type="tel" value={d.phone} onChange={(e) => updateDeptContact(idx, "phone", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                    <input type="email" value={d.email} onChange={(e) => updateDeptContact(idx, "email", e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Fax</label>
                    <input type="text" value={d.fax} onChange={(e) => updateDeptContact(idx, "fax", e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setDepartmentContacts(prev => [...prev, emptyDeptContact()])}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:border-brand-500 hover:text-brand-400 transition-colors">
              + Add Department Contact
            </button>
            {departmentContacts.length === 0 && (
              <p className="text-center text-sm text-slate-500">No department contacts added. You can skip this step.</p>
            )}
          </div>
        )}

        {/* ===== STEP 6: Banking Information ===== */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Banking Information</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Add at least one bank account for payouts.</p>
            </div>
            {bankingInfo.map((b, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Account {idx + 1}</h3>
                  {bankingInfo.length > 1 && (
                    <button type="button" onClick={() => setBankingInfo(prev => prev.filter((_, i) => i !== idx))}
                      className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Bank Name <span className="text-red-500">*</span></label>
                    <input type="text" value={b.bankName} onChange={(e) => updateBankingInfo(idx, "bankName", e.target.value)} className={inputCls} placeholder="e.g. Arab Bank" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Branch</label>
                    <input type="text" value={b.bankBranch} onChange={(e) => updateBankingInfo(idx, "bankBranch", e.target.value)} className={inputCls} placeholder="Branch name" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Account Number <span className="text-red-500">*</span></label>
                    <input type="text" value={b.accountNumber} onChange={(e) => updateBankingInfo(idx, "accountNumber", e.target.value)} className={inputCls} placeholder="Account number" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">IBAN</label>
                    <input type="text" value={b.iban} onChange={(e) => updateBankingInfo(idx, "iban", e.target.value)} className={inputCls} placeholder="JO..." />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">SWIFT Code</label>
                    <input type="text" value={b.swiftCode} onChange={(e) => updateBankingInfo(idx, "swiftCode", e.target.value)} className={inputCls} placeholder="SWIFT/BIC code" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">CliQ Alias</label>
                    <input type="text" value={b.cliq} onChange={(e) => updateBankingInfo(idx, "cliq", e.target.value)} className={inputCls} placeholder="CliQ alias" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Accountant / Manager Name</label>
                    <input type="text" value={b.accountantManagerName} onChange={(e) => updateBankingInfo(idx, "accountantManagerName", e.target.value)} className={inputCls} placeholder="Person managing this account" />
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setBankingInfo(prev => [...prev, emptyBanking()])}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:border-brand-500 hover:text-brand-400 transition-colors">
              + Add Bank Account
            </button>
          </div>
        )}

        {/* ===== STEP 7: Categorized Amenities ===== */}
        {step === 7 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Facilities & Amenities</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Select everything your workspace offers.</p>
            </div>

            <div className="rounded-xl bg-brand-500/10 border border-brand-500/20 p-4 text-sm text-brand-400 font-medium">
              <strong>Tip:</strong> For meeting rooms, ensure you have a projector/TV, whiteboard, speakerphone, and stable WiFi.
            </div>

            <div className="space-y-3">
              {AMENITY_CATEGORIES.map((cat) => {
                const isExpanded = expandedCategories.includes(cat.label);
                const selectedCount = cat.items.filter((a) => selectedAmenities.includes(a)).length;
                return (
                  <div key={cat.label} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-dark-950">
                    <button type="button" onClick={() => toggleCategory(cat.label)}
                      className="flex w-full items-center justify-between px-5 py-4 bg-slate-50 dark:bg-dark-850 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors text-left">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{cat.label}</span>
                      <span className="flex items-center gap-3">
                        {selectedCount > 0 && <span className="rounded-full bg-brand-500 text-white px-2 py-0.5 text-xs font-bold">{selectedCount}</span>}
                        <svg className={`h-4 w-4 text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
                        {cat.items.map((amenity) => {
                          const isSelected = selectedAmenities.includes(amenity);
                          return (
                            <button key={amenity} type="button" onClick={() => toggleAmenity(amenity)}
                              className={`rounded-xl px-4 py-3 text-xs font-bold border transition-all duration-200 text-left shadow-sm ${isSelected
                                ? "bg-brand-500 border-brand-500 text-white"
                                : "bg-white dark:bg-dark-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-dark-850"
                                }`}>
                              <span className="mr-2 opacity-80">{isSelected ? "✓" : "+"}</span>{amenity}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedAmenities.filter((a) => !AMENITY_CATEGORIES.flatMap((c) => c.items).includes(a)).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Custom Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAmenities.filter((a) => !AMENITY_CATEGORIES.flatMap((c) => c.items).includes(a)).map((custom) => (
                    <span key={custom} className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 text-xs font-bold text-brand-400">
                      {custom}
                      <button type="button" onClick={() => toggleAmenity(custom)} className="text-brand-500/60 hover:text-brand-400 rounded-full w-4 h-4 flex flex-shrink-0 items-center justify-center transition-colors">✕</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <input type="text" value={customAmenity} onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomAmenity())}
                className={`flex-1 ${inputCls}`} placeholder="Add a custom amenity..." />
              <button type="button" onClick={addCustomAmenity} disabled={!customAmenity.trim()}
                className="rounded-xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-slate-700 px-6 py-3 text-sm font-bold text-gray-900 dark:text-white hover:bg-slate-200 dark:hover:bg-dark-700 transition-colors shadow-sm disabled:opacity-40">
                Add
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 8: Images & Terms ===== */}
        {step === 8 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Images & Terms</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Upload photos and accept the vendor agreement.</p>
            </div>

            {uploadError && (
              <div className="rounded-xl bg-yellow-500/10 p-4 text-sm font-medium text-yellow-500 border border-yellow-500/20">{uploadError}</div>
            )}

            <label
              className="flex flex-col items-center justify-center w-full h-40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-950 hover:bg-slate-50 dark:hover:bg-dark-900 hover:border-brand-500/50 cursor-pointer transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleImageSelect(e.dataTransfer.files); }}
            >
              <svg className="h-8 w-8 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Drag & drop or <span className="text-brand-500">browse</span></span>
              <span className="text-xs font-medium text-slate-500 mt-1">Landscape images only</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageSelect(e.target.files)} />
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {images.map((img, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                    <img src={img.preview} alt={`Upload ${i + 1}`} className="w-full h-24 object-cover" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/80 text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Terms & Conditions</h3>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 p-4 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {VENDOR_TERMS_CONTENT}
              </div>
              <label className="flex items-start gap-4 cursor-pointer p-4 mt-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-dark-850 hover:border-brand-500/50 transition-colors">
                <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-brand-500 focus:ring-brand-500 bg-white dark:bg-dark-950" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  I have read and agree to the <strong className="text-gray-900 dark:text-white">AtSpaces Vendor Agreement</strong>.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* ===== STEP 9: Review ===== */}
        {step === 9 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review & Submit</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Everything look good? Hit submit to send your application.</p>
            </div>

            <div className="space-y-4">
              {/* Business Details */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3">Business Details</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><dt className="font-bold text-slate-500 mb-0.5">Company</dt><dd className="font-medium text-gray-900 dark:text-white">{companyName}</dd></div>
                  <div><dt className="font-bold text-slate-500 mb-0.5">Legal Name</dt><dd className="font-medium text-gray-900 dark:text-white">{companyLegalName}</dd></div>
                  <div><dt className="font-bold text-slate-500 mb-0.5">National ID</dt><dd className="font-medium text-gray-900 dark:text-white">{companyNationalId}</dd></div>
                  <div><dt className="font-bold text-slate-500 mb-0.5">Registration #</dt><dd className="font-medium text-gray-900 dark:text-white">{companyRegistrationNumber}</dd></div>
                  {phone && <div><dt className="font-bold text-slate-500 mb-0.5">Phone</dt><dd className="font-medium text-gray-900 dark:text-white">{phone}</dd></div>}
                  {website && <div><dt className="font-bold text-slate-500 mb-0.5">Website</dt><dd className="font-medium text-gray-900 dark:text-white truncate">{website}</dd></div>}
                  {registeredInCountry && <div><dt className="font-bold text-slate-500 mb-0.5">Country</dt><dd className="font-medium text-gray-900 dark:text-white">{registeredInCountry}</dd></div>}
                </dl>
              </div>

              {/* Signatories */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3">Authorized Signatories ({signatories.length})</h3>
                <div className="space-y-2">
                  {signatories.map((s, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">{s.fullName}</span>
                      {s.email && <span className="text-slate-500 ml-2">({s.email})</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contacts */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3">Contacts ({companyContacts.length} company, {departmentContacts.length} department)</h3>
                <div className="space-y-2">
                  {companyContacts.map((c, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">{c.contactPersonName}</span>
                      {c.email && <span className="text-slate-500 ml-2">({c.email})</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Banking */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 p-5 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3">Banking ({bankingInfo.length})</h3>
                <div className="space-y-2">
                  {bankingInfo.map((b, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">{b.bankName}</span>
                      <span className="text-slate-500 ml-2">****{b.accountNumber.slice(-4)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              {selectedAmenities.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3">Amenities ({selectedAmenities.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAmenities.map((a) => (
                      <span key={a} className="inline-flex rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1 text-xs font-bold text-brand-400">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos */}
              {images.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-dark-950 p-5 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3">Photos ({images.length})</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img, i) => (
                      <img key={i} src={img.preview} alt={`Preview ${i + 1}`} className="rounded-lg h-16 w-full object-cover border border-slate-200 dark:border-slate-800" />
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 text-sm font-bold text-green-400 text-center">
                ✓ You have agreed to the AtSpaces Vendor Agreement.
              </div>
            </div>
          </div>
        )}

        {/* ===== Navigation ===== */}
        <div className="mt-10 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6">
          {step > 1 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-850 px-6 py-3.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors shadow-sm"
            >← Back</button>
          ) : <div />}

          {step < totalSteps ? (
            <button
              type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext()}
              className="rounded-xl bg-brand-500 active:scale-95 px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,91,4,0.3)] hover:shadow-[0_6px_20px_rgba(255,91,4,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >Continue →</button>
          ) : (
            <button
              type="button" onClick={handleSubmit} disabled={isSubmitting}
              className="rounded-xl bg-brand-500 active:scale-95 px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,91,4,0.3)] hover:shadow-[0_6px_20px_rgba(255,91,4,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >{isSubmitting ? "Submitting..." : "Submit Application"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
