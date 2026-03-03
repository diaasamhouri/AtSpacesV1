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
      "Parking",
      "Elevator / Ramps",
      "Fire Exits",
      "Smoke Detectors",
      "CCTV / Security",
      "Emergency Lighting",
      "High-Speed WiFi (50+ Mbps)",
      "Daily Cleaning",
      "Ergonomic Furniture",
      "Projector / TV Screen",
      "Whiteboard",
      "Power Outlets",
    ],
  },
  {
    label: "Meeting Room",
    items: [
      "Conference Phone",
      "Display Screen",
      "HDMI Cables",
      "Soundproofing",
      "Lockable Doors",
      "Adjustable Lighting",
    ],
  },
  {
    label: "Office Space",
    items: [
      "Desks",
      "Ergonomic Chairs",
      "Cabinets / Storage",
      "Pantry / Restrooms",
      "24/7 Access",
      "Reception / Front Desk",
      "Mail Handling",
    ],
  },
  {
    label: "Event Space",
    items: [
      "Sound System",
      "Microphone",
      "Flexible Setup (Theater / Classroom / Banquet)",
      "Fire Extinguishers",
      "Evacuation Plan",
    ],
  },
  {
    label: "Coffee & Catering",
    items: [
      "Water Dispenser (Hot & Cold)",
      "Coffee Machine",
      "Tea Station",
      "Cups (Eco-Friendly)",
      "Sugar & Sweeteners",
      "Milk / Cream",
      "Napkins & Trays",
      "Light Snacks",
    ],
  },
  {
    label: "Technology & Equipment",
    items: [
      "Video Conferencing System",
      "Wireless Presentation (AirPlay / Chromecast)",
      "USB-C / HDMI Adapters",
      "Charging Stations (USB / Type-C / Wireless)",
      "Smart Room Controls",
      "Digital Booking Panel",
    ],
  },
  {
    label: "Comfort & Accessibility",
    items: [
      "Air Conditioning",
      "Ventilation / Fresh Air",
      "Wheelchair Accessible",
      "Multi-Language Signage",
      "First Aid Kit",
    ],
  },
];

export default function VendorApplicationPage() {
  const { user, token, isLoading, login } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const totalSteps = 5;

  // Step 1 — Business Details
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");

  // Step 2 — Amenities
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["General Standards"]);

  // Step 3 — Images
  const [images, setImages] = useState<{ file: File; preview: string; url?: string }[]>([]);
  const [uploadError, setUploadError] = useState("");

  // Step 4 — Terms
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
      const res = await fetch(`${API}/uploads`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();
      img.url = data.url;
      urls.push(data.url);
    }
    return urls;
  };

  // ==================== SUBMIT ====================
  const handleSubmit = async () => {
    if (!token) return;
    setIsSubmitting(true);
    setError("");
    try {
      const imageUrls = await uploadAllImages();
      const res = await fetch(`${API}/auth/become-vendor`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          companyName,
          description: description || undefined,
          phone: phone || undefined,
          website: website || undefined,
          images: imageUrls,
          amenities: selectedAmenities,
          agreedToTermsAt: new Date().toISOString(),
        }),
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
    if (step === 1) return companyName.trim().length > 0;
    if (step === 2) return selectedAmenities.length > 0;
    if (step === 3) return images.length > 0;
    if (step === 4) return agreedToTerms;
    return true;
  };

  const STEP_LABELS = ["Business", "Amenities", "Photos", "Terms", "Review"];

  // ==================== RENDER ====================
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 mt-8">
      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-2">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex flex-col items-center flex-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${i + 1 <= step
                  ? "bg-brand-500 text-white shadow-[0_4px_12px_rgba(255,91,4,0.3)]"
                  : "bg-dark-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                  }`}
              >
                {i + 1 < step ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`mt-2 text-xs font-bold uppercase tracking-wider ${i + 1 <= step ? "text-brand-500" : "text-slate-500"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
        <div className="relative h-1.5 rounded-full bg-dark-800 mt-2">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 shadow-[0_0_10px_rgba(255,100,0,0.5)] transition-all duration-500"
            style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-[2rem] bg-dark-900 p-8 sm:p-10 shadow-float border border-slate-200 dark:border-slate-800">
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
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                Company / Venue Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text" required value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-dark-950 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500"
                placeholder="e.g. The Hive Coworking"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Description</label>
              <textarea
                rows={3} value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-dark-950 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500"
                placeholder="What makes your space unique?"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Phone</label>
                <input
                  type="tel" value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-dark-950 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500"
                  placeholder="+962 7X XXX XXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Website</label>
                <input
                  type="url" value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-dark-950 px-4 py-3 text-sm text-gray-900 dark:text-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500"
                  placeholder="https://yourcompany.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP 2: Categorized Amenities ===== */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Facilities & Amenities</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Select everything your workspace offers.</p>
            </div>

            {/* Tip */}
            <div className="rounded-xl bg-brand-500/10 border border-brand-500/20 p-4 text-sm text-brand-400 font-medium">
              <span className="mr-2">💡</span> <strong>Tip:</strong> For meeting rooms, ensure you have a projector/TV, whiteboard, speakerphone, and stable WiFi as per AtSpaces standards.
            </div>

            {/* Category accordion */}
            <div className="space-y-3">
              {AMENITY_CATEGORIES.map((cat) => {
                const isExpanded = expandedCategories.includes(cat.label);
                const selectedCount = cat.items.filter((a) => selectedAmenities.includes(a)).length;
                return (
                  <div key={cat.label} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-dark-950">
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.label)}
                      className="flex w-full items-center justify-between px-5 py-4 bg-dark-850 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors text-left"
                    >
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{cat.label}</span>
                      <span className="flex items-center gap-3">
                        {selectedCount > 0 && (
                          <span className="rounded-full bg-brand-500 text-white px-2 py-0.5 text-xs font-bold">
                            {selectedCount}
                          </span>
                        )}
                        <svg
                          className={`h-4 w-4 text-slate-500 dark:text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
                        {cat.items.map((amenity) => {
                          const isSelected = selectedAmenities.includes(amenity);
                          return (
                            <button
                              key={amenity} type="button"
                              onClick={() => toggleAmenity(amenity)}
                              className={`rounded-xl px-4 py-3 text-xs font-bold border transition-all duration-200 text-left shadow-sm ${isSelected
                                ? "bg-brand-500 border-brand-500 text-white"
                                : "bg-dark-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-dark-850"
                                }`}
                            >
                              <span className="mr-2 opacity-80">{isSelected ? "✓" : "+"}</span>
                              {amenity}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom amenities */}
            {selectedAmenities.filter((a) => !AMENITY_CATEGORIES.flatMap((c) => c.items).includes(a)).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Custom Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAmenities
                    .filter((a) => !AMENITY_CATEGORIES.flatMap((c) => c.items).includes(a))
                    .map((custom) => (
                      <span key={custom} className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 text-xs font-bold text-brand-400">
                        {custom}
                        <button type="button" onClick={() => toggleAmenity(custom)} className="text-brand-500/60 hover:text-brand-400 hover:bg-brand-500/20 rounded-full w-4 h-4 flex flex-shrink-0 items-center justify-center transition-colors">✕</button>
                      </span>
                    ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="text" value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomAmenity())}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-dark-950 px-4 py-3 text-sm text-gray-900 dark:text-white focus:bg-dark-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors placeholder-slate-500"
                placeholder="Add a custom amenity..."
              />
              <button
                type="button" onClick={addCustomAmenity} disabled={!customAmenity.trim()}
                className="rounded-xl bg-dark-800 border border-slate-200 dark:border-slate-700 px-6 py-3 text-sm font-bold text-gray-900 dark:text-white hover:bg-dark-700 transition-colors shadow-sm disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* ===== STEP 3: Images ===== */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Space Imagery</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Upload high-quality <strong>landscape (horizontal)</strong> photos of your space.
              </p>
            </div>

            {uploadError && (
              <div className="rounded-xl bg-yellow-500/10 p-4 text-sm font-medium text-yellow-500 border border-yellow-500/20">⚠️ {uploadError}</div>
            )}

            <label
              className="flex flex-col items-center justify-center w-full h-48 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-dark-950 hover:bg-dark-900 hover:border-brand-500/50 cursor-pointer transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleImageSelect(e.dataTransfer.files); }}
            >
              <svg className="h-10 w-10 text-slate-500 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Drag & drop or <span className="text-brand-500">browse files</span></span>
              <span className="text-xs font-medium text-slate-500 mt-2">Landscape images only (width &gt; height)</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageSelect(e.target.files)} />
            </label>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {images.map((img, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                    <img src={img.preview} alt={`Upload ${i + 1}`} className="w-full h-32 object-cover" />
                    <button
                      type="button" onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/80 text-gray-900 dark:text-white text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== STEP 4: Terms & Conditions ===== */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Terms & Conditions</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Please read and accept the AtSpaces Vendor Agreement.</p>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-dark-950 p-6 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {VENDOR_TERMS_CONTENT}
            </div>

            <label className="flex items-start gap-4 cursor-pointer p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-dark-850 hover:border-brand-500/50 transition-colors">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-brand-500 focus:ring-brand-500 bg-dark-950"
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                I have read and agree to the <strong className="text-gray-900 dark:text-white">AtSpaces Vendor Agreement</strong>. I confirm my space meets the AtSpaces Standardization Guidelines.
              </span>
            </label>
          </div>
        )}

        {/* ===== STEP 5: Review ===== */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review & Submit</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Everything look good? Hit submit to send your application.</p>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-dark-950 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-4">Business Details</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div>
                    <dt className="font-bold text-slate-500 dark:text-slate-400 mb-1">Company</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{companyName}</dd>
                  </div>
                  {phone && (<div><dt className="font-bold text-slate-500 dark:text-slate-400 mb-1">Phone</dt><dd className="font-medium text-gray-900 dark:text-white">{phone}</dd></div>)}
                  {website && (<div><dt className="font-bold text-slate-500 dark:text-slate-400 mb-1">Website</dt><dd className="font-medium text-gray-900 dark:text-white truncate">{website}</dd></div>)}
                </dl>
                {description && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <dt className="font-bold text-slate-500 dark:text-slate-400 mb-2">Description</dt>
                    <dd className="font-medium text-slate-600 dark:text-slate-300">{description}</dd>
                  </div>
                )}
              </div>

              {selectedAmenities.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-dark-950 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-4">Amenities ({selectedAmenities.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAmenities.map((a) => (
                      <span key={a} className="inline-flex rounded-full bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 text-xs font-bold text-brand-400">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              {images.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-dark-950 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-4">Photos ({images.length})</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {images.map((img, i) => (
                      <img key={i} src={img.preview} alt={`Preview ${i + 1}`} className="rounded-xl h-24 w-full object-cover border border-slate-200 dark:border-slate-800" />
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-5 text-sm font-bold text-green-400 text-center">
                ✓ You have agreed to the AtSpaces Vendor Agreement.
              </div>
            </div>
          </div>
        )}

        {/* ===== Navigation ===== */}
        <div className="mt-10 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-6">
          {step > 1 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-dark-850 px-6 py-3.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors shadow-sm"
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
