import Link from 'next/link';

export default function SpaceNotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Space not found
      </h1>
      <p className="mt-3 text-gray-600 dark:text-gray-400">
        This space may have been removed or is no longer available.
      </p>
      <Link
        href="/spaces"
        className="mt-6 inline-flex rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500/90"
      >
        Browse all spaces
      </Link>
    </div>
  );
}
