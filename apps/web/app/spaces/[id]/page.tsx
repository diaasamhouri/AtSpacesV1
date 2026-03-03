import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getBranch } from '../../../lib/branches';
import {
  formatCity,
  formatServiceType,
  formatPrice,
  formatPricingInterval,
} from '../../../lib/format';
import { BookNowButton } from '../../components/book-now-button';
import { MotionWrapper } from '../../components/ui/motion-wrapper';
import type { Metadata } from 'next';
import { SpaceMapSection } from '../../components/space-map-section';
import { ReviewsSection } from '../../components/reviews-section';
import { FavoriteButton } from '../../components/favorite-button';
import { VerifiedBadge } from '../../components/verified-badge';

interface SpaceDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: SpaceDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const branch = await getBranch(id);
    return {
      title: `${branch.name} | AtSpaces`,
      description: branch.description || `Book workspace at ${branch.name} in ${formatCity(branch.city)}.`,
    };
  } catch {
    return { title: 'Space Not Found | AtSpaces' };
  }
}

const SOCIAL_ICONS: Record<string, { label: string; svg: React.ReactNode }> = {
  instagram: { label: 'Instagram', svg: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z"/></svg> },
  facebook: { label: 'Facebook', svg: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073Z"/></svg> },
  linkedin: { label: 'LinkedIn', svg: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z"/></svg> },
  twitter: { label: 'X', svg: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/></svg> },
  tiktok: { label: 'TikTok', svg: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z"/></svg> },
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_SHORT: Record<string, string> = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

export default async function SpaceDetailPage({ params }: SpaceDetailPageProps) {
  const { id } = await params;

  let branch: any;
  try {
    branch = await getBranch(id);
  } catch {
    notFound();
  }

  const socialLinks = (branch.vendor?.socialLinks || {}) as Record<string, string>;
  const hasSocials = Object.values(socialLinks).some((v) => v && v.trim());
  const operatingHours = branch.operatingHours as Record<string, { open: string; close: string }> | null;
  const amenities = (branch.amenities || []) as string[];
  const hasCoords = branch.latitude && branch.longitude;

  return (
    <div className="bg-dark-950 min-h-screen pt-24 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <MotionWrapper type="fade-in">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
            <Link href="/spaces" className="hover:text-brand-500 transition-colors">Spaces</Link>
            <span className="text-slate-700">/</span>
            <Link href={`/spaces?city=${branch.city}`} className="hover:text-brand-500 transition-colors">
              {formatCity(branch.city)}
            </Link>
            <span className="text-slate-700">/</span>
            <span className="text-gray-900 dark:text-white">{branch.name}</span>
          </nav>
        </MotionWrapper>

        {/* Header */}
        <MotionWrapper type="fade-up" delay={0.1} className="mt-8 max-w-3xl">
          <p className="text-sm font-bold tracking-widest text-brand-500 uppercase mb-2 flex items-center gap-1">
            {branch.vendor?.companyName}
            {(branch.vendor as any)?.isVerified && <VerifiedBadge size="sm" />}
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
            {branch.name}
          </h1>
          <FavoriteButton branchId={branch.id} size="md" />
          <p className="mt-4 flex items-center text-lg text-slate-500 dark:text-slate-400">
            <svg className="mr-2 h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            {branch.address} &middot; {formatCity(branch.city)}
          </p>
        </MotionWrapper>

        {/* Images Gallery */}
        {branch.images.length > 0 && (
          <>
            {/* Mobile: horizontal scroll */}
            <MotionWrapper type="scale-up" delay={0.2} className="mt-10 sm:hidden">
              <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
                {branch.images.slice(0, 5).map((url: string, i: number) => (
                  <div key={i} className="relative w-[85vw] shrink-0 snap-center h-64 rounded-2xl overflow-hidden bg-dark-900 group shadow-sm">
                    <Image src={url} alt={`${branch.name} - ${i + 1}`} fill
                      sizes="85vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      unoptimized={!url.startsWith('https://')} />
                    <div className="absolute inset-0 bg-transparent group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                ))}
              </div>
            </MotionWrapper>

            {/* Desktop: grid layout */}
            <MotionWrapper type="scale-up" delay={0.2} className="mt-10 hidden sm:grid gap-3 sm:grid-cols-4 grid-rows-2 h-[60vh] min-h-[500px]">
              {branch.images.slice(0, 5).map((url: string, i: number) => (
                <div key={i}
                  className={`relative overflow-hidden bg-dark-900 group shadow-sm transition-all duration-500 ${i === 0
                    ? 'sm:col-span-2 row-span-2 rounded-[2rem] sm:rounded-l-[3rem] sm:rounded-r-xl'
                    : i === 2 ? 'sm:col-span-1 row-span-1 rounded-tr-[2rem] sm:rounded-tr-[3rem] rounded-tl-xl sm:rounded-l-xl rounded-b-xl'
                      : i === 4 ? 'sm:col-span-1 row-span-1 rounded-br-[2rem] sm:rounded-br-[3rem] rounded-bl-xl sm:rounded-l-xl rounded-t-xl'
                        : 'sm:col-span-1 row-span-1 border border-slate-200 dark:border-slate-800 rounded-xl'
                    }`}>
                  <Image src={url} alt={`${branch.name} - ${i + 1}`} fill
                    sizes={i === 0 ? '50vw' : '25vw'}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized={!url.startsWith('https://')} />
                  <div className="absolute inset-0 bg-transparent group-hover:bg-black/20 transition-colors duration-300" />
                </div>
              ))}
            </MotionWrapper>
          </>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <MotionWrapper type="fade-up" delay={0.25} className="mt-12">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Amenities & Facilities</h2>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a: string, i: number) => (
                <span key={i} className="inline-flex items-center rounded-full bg-brand-500/10 px-4 py-2 text-sm font-bold text-brand-500">
                  {a}
                </span>
              ))}
            </div>
          </MotionWrapper>
        )}

        <div className="mt-16 grid gap-12 lg:grid-cols-3 pb-24 lg:pb-0">
          {/* Main content */}
          <div className="space-y-16 lg:col-span-2">
            {/* Description */}
            {branch.description && (
              <MotionWrapper type="fade-up" delay={0.3} className="prose prose-lg prose-invert text-slate-500 dark:text-slate-400 max-w-none">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">About this space</h2>
                <p className="leading-relaxed font-medium">{branch.description}</p>
              </MotionWrapper>
            )}

            {/* Operating Hours */}
            {operatingHours && Object.keys(operatingHours).length > 0 && (
              <MotionWrapper type="fade-up" delay={0.35}>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">Operating Hours</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {DAYS.map((day) => {
                    const hours = operatingHours[day];
                    const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === day;
                    return (
                      <div key={day} className={`rounded-2xl p-4 transition-colors ${isToday ? 'bg-brand-500/10 border border-brand-500/30' : 'bg-dark-900 border border-slate-200 dark:border-slate-800'}`}>
                        <div className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-brand-500' : 'text-slate-500'}`}>
                          {DAY_SHORT[day]}
                        </div>
                        <div className={`mt-1 text-sm font-bold ${isToday ? 'text-gray-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                          {hours ? `${hours.open} – ${hours.close}` : 'Closed'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </MotionWrapper>
            )}

            {/* Map */}
            {(hasCoords || branch.googleMapsUrl) && (
              <MotionWrapper type="fade-up" delay={0.4}>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">Location</h2>
                {hasCoords && (
                  <SpaceMapSection lat={branch.latitude} lng={branch.longitude} name={branch.name} />
                )}
                {branch.googleMapsUrl && (
                  <a href={branch.googleMapsUrl} target="_blank" rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-dark-900 px-5 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-dark-850 hover:text-gray-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-800">
                    <svg className="h-5 w-5 text-brand-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    Open in Google Maps
                  </a>
                )}
              </MotionWrapper>
            )}

            {/* Services & Pricing */}
            <MotionWrapper type="fade-up" delay={0.45}>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight">Available Options</h2>
              <div className="space-y-6">
                {branch.services.map((service: any) => (
                  <div key={service.id}
                    className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-dark-900 p-8 shadow-float hover:shadow-[0_10px_40px_rgba(255,91,4,0.1)] hover:border-brand-500/50 transition-all duration-500 group">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-flex rounded-full bg-brand-500/10 px-4 py-1.5 text-xs font-bold tracking-wide text-brand-500 mb-4 transition-colors group-hover:bg-brand-500/20">
                          {formatServiceType(service.type)}
                        </span>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight group-hover:text-brand-500 transition-colors duration-300">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="mt-3 text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">{service.description}</p>
                        )}
                        <p className="mt-5 flex items-center text-sm font-bold text-slate-600 dark:text-slate-300 bg-dark-850 max-w-max px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                          <svg className="mr-2 h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                          </svg>
                          Fits up to {service.capacity} {service.capacity === 1 ? 'person' : 'people'}
                        </p>
                      </div>
                    </div>

                    {/* Pricing grid */}
                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {service.pricing.map((p: any) => (
                        <div key={p.id}
                          className="flex flex-col rounded-[1.5rem] bg-dark-850 p-5 border border-slate-200 dark:border-slate-700 shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                          <span className="text-sm font-bold text-slate-500 mb-1 tracking-wide uppercase">
                            {formatPricingInterval(p.interval)}
                          </span>
                          <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            {formatPrice(p.price, p.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </MotionWrapper>

            {/* Reviews */}
            <MotionWrapper type="fade-up" delay={0.5}>
              <ReviewsSection branchId={branch.id} />
            </MotionWrapper>
          </div>

          {/* Sidebar — desktop only */}
          <aside className="hidden lg:block lg:col-span-1">
            <MotionWrapper type="fade-up" delay={0.5} className="sticky top-32 space-y-8">

              {/* Booking Card */}
              <div className="bg-dark-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-float relative overflow-hidden group">
                <div className="absolute -inset-x-2 -top-2 h-32 bg-gradient-to-b from-brand-500/10 to-transparent blur-xl pointer-events-none" />
                <div className="relative z-10">
                  <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">Book Space</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Select dates and view availability instantly.</p>

                  <BookNowButton
                    branchId={branch.id}
                    branchName={branch.name}
                    services={branch.services}
                    operatingHours={operatingHours}
                  />
                </div>
              </div>

              {/* Contact Details */}
              <div className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-dark-900 p-8 shadow-float group hover:shadow-[0_10px_40px_rgba(255,91,4,0.1)] transition-all duration-500">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">Host Contact</h3>
                <div className="space-y-5">
                  {branch.phone && (
                    <div className="flex items-center text-slate-500 dark:text-slate-400 hover:text-brand-500 transition-colors">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dark-800 mr-4 group-hover:bg-brand-500/10 transition-colors duration-300">
                        <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-2.896-1.596-5.48-4.08-7.074-6.97l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                        </svg>
                      </div>
                      <a href={`tel:${branch.phone}`} className="font-bold text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors">
                        {branch.phone}
                      </a>
                    </div>
                  )}
                  {branch.email && (
                    <div className="flex items-center text-slate-500 dark:text-slate-400 hover:text-brand-500 transition-colors">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dark-800 mr-4 group-hover:bg-brand-500/10 transition-colors duration-300">
                        <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                        </svg>
                      </div>
                      <a href={`mailto:${branch.email}`} className="font-bold text-slate-600 dark:text-slate-300 hover:text-brand-500 transition-colors truncate">
                        {branch.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Links */}
              {hasSocials && (
                <div className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-dark-900 p-8 shadow-float">
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-5 tracking-tight">Follow Us</h3>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(socialLinks).map(([key, url]) => {
                      if (!url || !url.trim()) return null;
                      const info = SOCIAL_ICONS[key];
                      if (!info) return null;
                      return (
                        <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-dark-850 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-brand-500/10 hover:text-brand-500 transition-colors border border-slate-200 dark:border-slate-700 hover:border-brand-500/50">
                          {info.svg}
                          {info.label}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

            </MotionWrapper>
          </aside>
        </div>
      </div>

      {/* Mobile sticky booking CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden glass-panel border-t border-slate-200 dark:border-slate-800 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            {branch.services.length > 0 && (() => {
              const allPrices = branch.services.flatMap((s: any) => s.pricing.map((p: any) => ({ price: Number(p.price), currency: p.currency, interval: p.interval })));
              const lowest = allPrices.sort((a: any, b: any) => a.price - b.price)[0];
              return lowest ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  From <span className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(lowest.price, lowest.currency)}</span>
                  <span className="text-xs">/{formatPricingInterval(lowest.interval).toLowerCase()}</span>
                </p>
              ) : null;
            })()}
          </div>
          <BookNowButton
            branchId={branch.id}
            branchName={branch.name}
            services={branch.services}
            operatingHours={operatingHours}
          />
        </div>
      </div>
    </div>
  );
}
