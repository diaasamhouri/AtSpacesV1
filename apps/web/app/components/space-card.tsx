import Image from 'next/image';
import Link from 'next/link';
import {
  formatCity,
  formatServiceType,
  formatPrice,
} from '../../lib/format';
import type { BranchListItem } from '../../lib/types';

interface SpaceCardProps {
  branch: BranchListItem;
}

export function SpaceCard({ branch }: SpaceCardProps) {
  const imageUrl = branch.images[0] || '/placeholder-space.svg';

  return (
    <Link
      href={`/spaces/${branch.id}`}
      className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-dark-900"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100 dark:bg-dark-800">
        <Image
          src={imageUrl}
          alt={branch.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform group-hover:scale-105"
          unoptimized={!imageUrl.startsWith('https://')}
        />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Vendor name */}
        <p className="text-xs font-medium text-brand-500">
          {branch.vendor.companyName}
        </p>

        {/* Branch name */}
        <h3 className="mt-1 line-clamp-1 text-lg font-semibold text-gray-900 dark:text-white">
          {branch.name}
        </h3>

        {/* Location */}
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {branch.address} &middot; {formatCity(branch.city)}
        </p>

        {/* Service type badges */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {branch.serviceTypes.map((type) => (
            <span
              key={type}
              className="inline-flex rounded-full bg-brand-500/10 px-2.5 py-0.5 text-xs font-medium text-brand-500"
            >
              {formatServiceType(type)}
            </span>
          ))}
        </div>

        {/* Starting price */}
        {branch.startingPrice !== null && (
          <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">
            From{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatPrice(branch.startingPrice)}
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}
