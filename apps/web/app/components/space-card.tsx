"use client";

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  formatCity,
  formatServiceType,
  formatPrice,
} from '../../lib/format';
import type { BranchListItem } from '../../lib/types';
import { FavoriteButton } from './favorite-button';
import { VerifiedBadge } from './verified-badge';

interface SpaceCardProps {
  branch: BranchListItem;
  index?: number;
}

export function SpaceCard({ branch, index = 0 }: SpaceCardProps) {
  const imageUrl = branch.images[0] || '/placeholder-space.svg';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
    >
      <Link
        href={`/spaces/${branch.id}`}
        className="group flex flex-col overflow-hidden rounded-[2rem] bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 shadow-float transition-all duration-300 hover:border-brand-500/50 hover:shadow-[0_10px_40px_rgba(255,91,4,0.1)] hover:-translate-y-1 block h-full"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-dark-850 p-2">
          <div className="relative h-full w-full overflow-hidden rounded-[1.5rem]">
            <Image
              src={imageUrl}
              alt={branch.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              unoptimized={!imageUrl.startsWith('https://')}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950/60 via-transparent to-transparent" />
          </div>
          {(branch.vendor as any).isVerified && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-white/90 dark:bg-dark-800/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <VerifiedBadge size="xs" />
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Verified</span>
            </div>
          )}
          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton branchId={branch.id} size="sm" />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-6 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold tracking-wide text-brand-500 uppercase">
              {branch.vendor.companyName}
            </p>
            {branch.startingPrice !== null && (
              <p className="text-sm font-bold text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-md">
                {formatPrice(branch.startingPrice)}
                <span className="text-xs font-medium text-brand-500/70"> /hr</span>
              </p>
            )}
          </div>

          <h3 className="line-clamp-1 text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
            {branch.name}
          </h3>

          <p className="mt-1.5 flex items-center text-sm text-slate-500 dark:text-slate-400">
            <svg className="mr-1.5 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <span className="truncate">{branch.address} &middot; {formatCity(branch.city)}</span>
          </p>

          <div className="mt-auto pt-4 flex flex-wrap gap-2">
            {branch.serviceTypes.slice(0, 3).map((type) => (
              <span
                key={type}
                className="inline-flex rounded-md bg-dark-800 border border-slate-200 dark:border-slate-700/50 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300"
              >
                {formatServiceType(type)}
              </span>
            ))}
            {branch.serviceTypes.length > 3 && (
              <span className="inline-flex rounded-md bg-dark-800 border border-slate-200 dark:border-slate-700/50 px-2 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                +{branch.serviceTypes.length - 3}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
