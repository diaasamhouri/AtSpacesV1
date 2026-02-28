'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { PaginationMeta } from '../../lib/types';

interface PaginationProps {
  meta: PaginationMeta;
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (current > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('ellipsis');
  }

  pages.push(total);
  return pages;
}

export function Pagination({ meta }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  if (meta.totalPages <= 1) return null;

  const pages = getPageNumbers(meta.page, meta.totalPages);

  return (
    <div className="mt-8 flex items-center justify-between border-t border-slate-800 pt-6">
      <p className="text-sm text-slate-400">
        Page {meta.page} of {meta.totalPages}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => goToPage(meta.page - 1)}
          disabled={meta.page <= 1}
          className="rounded-xl border border-slate-700 bg-dark-900 px-4 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-dark-850 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-dark-900"
        >
          Previous
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {pages.map((page, idx) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-sm text-slate-500">
                &hellip;
              </span>
            ) : (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`min-w-[2.25rem] rounded-lg px-3 py-2 text-sm font-bold transition-all ${
                  page === meta.page
                    ? 'bg-brand-500 text-white shadow-[0_0_12px_rgba(255,91,4,0.4)]'
                    : 'text-slate-400 hover:bg-dark-850 hover:text-white'
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>

        <button
          onClick={() => goToPage(meta.page + 1)}
          disabled={meta.page >= meta.totalPages}
          className="rounded-xl border border-slate-700 bg-dark-900 px-4 py-2 text-sm font-bold text-slate-300 transition-colors hover:bg-dark-850 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-dark-900"
        >
          Next
        </button>
      </div>
    </div>
  );
}
