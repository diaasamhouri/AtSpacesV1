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
import type { Metadata } from 'next';

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
      description:
        branch.description ||
        `Book workspace at ${branch.name} in ${formatCity(branch.city)}`,
    };
  } catch {
    return { title: 'Space Not Found | AtSpaces' };
  }
}

export default async function SpaceDetailPage({
  params,
}: SpaceDetailPageProps) {
  const { id } = await params;

  let branch;
  try {
    branch = await getBranch(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link href="/spaces" className="hover:text-brand-500">
          Spaces
        </Link>
        <span>/</span>
        <Link
          href={`/spaces?city=${branch.city.toLowerCase()}`}
          className="hover:text-brand-500"
        >
          {formatCity(branch.city)}
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">{branch.name}</span>
      </nav>

      {/* Header */}
      <div className="mt-6">
        <p className="text-sm font-medium text-brand-500">
          {branch.vendor.companyName}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
          {branch.name}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {branch.address} &middot; {formatCity(branch.city)}
        </p>
      </div>

      {/* Images Gallery */}
      {branch.images.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branch.images.map((url, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-dark-800 ${
                i === 0
                  ? 'aspect-[16/9] sm:col-span-2 lg:col-span-2'
                  : 'aspect-square'
              }`}
            >
              <Image
                src={url}
                alt={`${branch.name} - ${i + 1}`}
                fill
                sizes={
                  i === 0
                    ? '(max-width: 640px) 100vw, 66vw'
                    : '(max-width: 640px) 100vw, 33vw'
                }
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-10 lg:col-span-2">
          {/* Description */}
          {branch.description && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                About this space
              </h2>
              <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-400">
                {branch.description}
              </p>
            </section>
          )}

          {/* Services & Pricing */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Services &amp; Pricing
            </h2>
            <div className="mt-4 space-y-4">
              {branch.services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-2xl border border-gray-200 p-6 dark:border-gray-700"
                >
                  <div>
                    <span className="inline-flex rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-500">
                      {formatServiceType(service.type)}
                    </span>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {service.description}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Capacity: {service.capacity}{' '}
                      {service.capacity === 1 ? 'person' : 'people'}
                    </p>
                  </div>

                  {/* Pricing grid */}
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {service.pricing.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-dark-800"
                      >
                        <span className="text-sm capitalize text-gray-600 dark:text-gray-400">
                          Per {formatPricingInterval(p.interval)}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatPrice(p.price, p.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Contact card */}
            <div className="rounded-2xl border border-gray-200 p-6 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Contact
              </h3>
              {branch.phone && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  Phone:{' '}
                  <a
                    href={`tel:${branch.phone}`}
                    className="text-brand-500 hover:underline"
                  >
                    {branch.phone}
                  </a>
                </p>
              )}
              {branch.email && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Email:{' '}
                  <a
                    href={`mailto:${branch.email}`}
                    className="text-brand-500 hover:underline"
                  >
                    {branch.email}
                  </a>
                </p>
              )}
              <BookNowButton
                branchId={branch.id}
                branchName={branch.name}
                services={branch.services}
              />
            </div>

            {/* Location card */}
            {branch.latitude && branch.longitude && (
              <div className="rounded-2xl border border-gray-200 p-6 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Location
                </h3>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  {branch.address}
                </p>
                <div className="mt-3 flex aspect-video items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-800">
                  <p className="text-xs text-gray-400">Map coming soon</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
