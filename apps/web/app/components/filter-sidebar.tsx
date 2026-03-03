'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

const CITIES = [
  { value: 'amman', label: 'Amman' },
  { value: 'irbid', label: 'Irbid' },
  { value: 'aqaba', label: 'Aqaba' },
];

const SERVICE_TYPES = [
  { value: 'hot-desk', label: 'Hot Desk' },
  { value: 'private-office', label: 'Private Office' },
  { value: 'meeting-room', label: 'Meeting Room' },
  { value: 'event-space', label: 'Event Space' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
];

interface FilterSidebarProps {
  activeCity?: string;
  activeType?: string;
  activeSort?: string;
}

export function FilterSidebar({ activeCity, activeType, activeSort }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && params.get(key) !== value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete('page');
      router.push(`/spaces?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-6">
      {/* City filter */}
      <div>
        <h3 className="text-sm font-bold tracking-wider uppercase text-gray-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
          City
          {activeCity && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
        </h3>
        <div className="mt-3 space-y-2">
          {CITIES.map((city) => (
            <button
              key={city.value}
              onClick={() => updateFilter('city', city.value)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${activeCity === city.value
                  ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-dark-850 hover:text-gray-900 dark:hover:text-white border border-transparent'
                }`}
            >
              {city.label}
            </button>
          ))}
        </div>
      </div>

      {/* Service type filter */}
      <div>
        <h3 className="text-sm font-bold tracking-wider uppercase text-gray-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
          Space Type
          {activeType && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
        </h3>
        <div className="mt-3 space-y-2">
          {SERVICE_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => updateFilter('type', type.value)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${activeType === type.value
                  ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-dark-850 hover:text-gray-900 dark:hover:text-white border border-transparent'
                }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div>
        <h3 className="text-sm font-bold tracking-wider uppercase text-gray-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-2">
          Sort By
          {activeSort && activeSort !== 'newest' && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
        </h3>
        <div className="mt-3 space-y-2">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => updateFilter('sort', option.value === 'newest' ? undefined : option.value)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-all ${(activeSort || 'newest') === option.value
                  ? 'bg-brand-500/10 text-brand-500 border border-brand-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-dark-850 hover:text-gray-900 dark:hover:text-white border border-transparent'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear filters */}
      {(activeCity || activeType || (activeSort && activeSort !== 'newest')) && (
        <button
          onClick={() => router.push('/spaces')}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-dark-850 py-2 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

interface MobileFilterDrawerProps {
  activeCity?: string;
  activeType?: string;
  activeSort?: string;
  resultCount: number;
}

export function MobileFilterDrawer({ activeCity, activeType, activeSort, resultCount }: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false);

  const filterCount = [activeCity, activeType, activeSort && activeSort !== 'newest'].filter(Boolean).length;

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-dark-900 px-4 py-3 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-850 transition-colors"
      >
        <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
        </svg>
        Filters
        {filterCount > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
            {filterCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          {/* Drawer from bottom */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] rounded-t-3xl bg-dark-900 border-t border-slate-200 dark:border-slate-800 p-6 overflow-y-auto animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <FilterSidebar activeCity={activeCity} activeType={activeType} activeSort={activeSort} />

            {/* Show results CTA */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-6 w-full rounded-xl bg-brand-500 px-4 py-3.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors shadow-[0_4px_12px_rgba(255,91,4,0.4)]"
            >
              Show {resultCount} {resultCount === 1 ? 'result' : 'results'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
