import { Suspense } from 'react';
import { listBranches } from '../../lib/branches';
import {
  formatCity,
  formatServiceType,
  parseServiceTypeSlug,
} from '../../lib/format';
import type { BranchListItem, PaginationMeta } from '../../lib/types';
import { SpaceCard } from '../components/space-card';
import { FilterSidebar } from '../components/filter-sidebar';
import { MobileFilterDrawer } from '../components/filter-sidebar';
import { Pagination } from '../components/pagination';
import { SearchBar } from '../components/search-bar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Spaces | AtSpaces',
  description:
    'Find and book coworking spaces across Amman, Irbid, and Aqaba. Hot desks, private offices, and meeting rooms.',
};

interface SpacesPageProps {
  searchParams: Promise<{
    city?: string;
    type?: string;
    search?: string;
    page?: string;
    sort?: string;
  }>;
}

export default async function SpacesPage({ searchParams }: SpacesPageProps) {
  const params = await searchParams;

  const apiParams = {
    city: params.city?.toUpperCase(),
    type: params.type ? parseServiceTypeSlug(params.type) : undefined,
    search: params.search,
    page: params.page ? parseInt(params.page, 10) : 1,
    limit: 12,
    sort: params.sort,
  };

  let branches: BranchListItem[];
  let meta: PaginationMeta;
  let error = false;

  try {
    const result = await listBranches(apiParams);
    branches = result.data;
    meta = result.meta;
  } catch {
    branches = [];
    meta = { page: 1, limit: 12, total: 0, totalPages: 0 };
    error = true;
  }

  const filterParts: string[] = [];
  if (params.type)
    filterParts.push(formatServiceType(parseServiceTypeSlug(params.type)));
  if (params.city)
    filterParts.push(`in ${formatCity(params.city.toUpperCase())}`);
  const pageTitle =
    filterParts.length > 0 ? `${filterParts.join(' ')} Spaces` : 'Browse Spaces';

  return (
    <div className="bg-dark-950 min-h-screen pt-24 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {pageTitle}
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {error
              ? 'Unable to load spaces. Please try again later.'
              : `${meta.total} ${meta.total === 1 ? 'space' : 'spaces'} found`}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mt-6">
          <Suspense>
            <SearchBar defaultValue={params.search} />
          </Suspense>
        </div>

        {/* Mobile filter button */}
        <div className="mt-6 lg:hidden">
          <Suspense>
            <MobileFilterDrawer
              activeCity={params.city}
              activeType={params.type}
              activeSort={params.sort}
              resultCount={meta.total}
            />
          </Suspense>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filter Sidebar — desktop only */}
          <aside className="hidden lg:block lg:col-span-1">
            <Suspense>
              <FilterSidebar
                activeCity={params.city}
                activeType={params.type}
                activeSort={params.sort}
              />
            </Suspense>
          </aside>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            {branches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center bg-dark-900">
                <svg
                  className="mx-auto h-12 w-12 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
                <p className="mt-4 text-slate-500 dark:text-slate-400">
                  {error
                    ? 'Could not connect to the server. Make sure the API is running.'
                    : 'No spaces match your filters. Try adjusting your search.'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {branches.map((branch) => (
                    <SpaceCard key={branch.id} branch={branch} />
                  ))}
                </div>
                {meta.totalPages > 1 && (
                  <Suspense>
                    <Pagination meta={meta} />
                  </Suspense>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
