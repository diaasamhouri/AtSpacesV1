'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const CITIES = [
  { value: 'amman', label: 'Amman' },
  { value: 'irbid', label: 'Irbid' },
  { value: 'aqaba', label: 'Aqaba' },
];

const SERVICE_TYPES = [
  { value: 'hot-desk', label: 'Hot Desk' },
  { value: 'private-office', label: 'Private Office' },
  { value: 'meeting-room', label: 'Meeting Room' },
];

interface FilterSidebarProps {
  activeCity?: string;
  activeType?: string;
}

export function FilterSidebar({ activeCity, activeType }: FilterSidebarProps) {
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
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          City
        </h3>
        <div className="mt-3 space-y-2">
          {CITIES.map((city) => (
            <button
              key={city.value}
              onClick={() => updateFilter('city', city.value)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeCity === city.value
                  ? 'bg-brand-500/10 font-medium text-brand-500'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-800'
              }`}
            >
              {city.label}
            </button>
          ))}
        </div>
      </div>

      {/* Service type filter */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Space Type
        </h3>
        <div className="mt-3 space-y-2">
          {SERVICE_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => updateFilter('type', type.value)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeType === type.value
                  ? 'bg-brand-500/10 font-medium text-brand-500'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-800'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear filters */}
      {(activeCity || activeType) && (
        <button
          onClick={() => router.push('/spaces')}
          className="text-sm font-medium text-brand-500 hover:text-brand-500/80"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
