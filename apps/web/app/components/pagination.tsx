'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { PaginationMeta } from '../../lib/types';

interface PaginationProps {
  meta: PaginationMeta;
}

export function Pagination({ meta }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`/spaces?${params.toString()}`);
  };

  return (
    <div className="mt-8 flex items-center justify-between">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Page {meta.page} of {meta.totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => goToPage(meta.page - 1)}
          disabled={meta.page <= 1}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-dark-800"
        >
          Previous
        </button>
        <button
          onClick={() => goToPage(meta.page + 1)}
          disabled={meta.page >= meta.totalPages}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-dark-800"
        >
          Next
        </button>
      </div>
    </div>
  );
}
