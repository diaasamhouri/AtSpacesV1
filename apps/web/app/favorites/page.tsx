"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import { getUserFavorites } from "../../lib/reviews";
import { formatCity, formatServiceType } from "../../lib/format";
import { FavoriteButton } from "../components/favorite-button";

export default function FavoritesPage() {
    const { user, token, isLoading } = useAuth();
    const router = useRouter();
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isLoading) return;
        if (!user || !token) { router.push("/auth/login?redirect=/favorites"); return; }
        fetchFavorites();
    }, [user, token, isLoading, router]);

    async function fetchFavorites() {
        if (!token) return;
        try {
            const data = await getUserFavorites(token);
            setFavorites(data);
        } catch {
            setError("Failed to load favorites. Please try again.");
        }
        setLoading(false);
    }

    if (isLoading || (!user && !loading)) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 pt-24 pb-8 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Favorites</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Spaces you've saved for later</p>

            {error && (
                <div className="mt-6 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm font-medium text-red-400">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-72 animate-pulse rounded-[2rem] bg-dark-800 border border-slate-200 dark:border-slate-700/50" />
                    ))}
                </div>
            ) : favorites.length === 0 ? (
                <div className="mt-16 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-dark-800 mb-6">
                        <svg className="h-10 w-10 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No favorites yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">Start exploring and save the spaces you love to book them easily later.</p>
                    <Link href="/spaces"
                        className="inline-flex rounded-xl bg-brand-500 active:scale-95 px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_12px_rgba(255,91,4,0.3)] hover:shadow-[0_6px_20px_rgba(255,91,4,0.5)] hover:-translate-y-0.5 transition-all duration-300">
                        Browse Spaces
                    </Link>
                </div>
            ) : (
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {favorites.map((fav: any) => {
                        const branch = fav.branch;
                        const imageUrl = branch.images?.[0] || "/placeholder-space.svg";
                        const types = [...new Set((branch.services || []).map((s: any) => s.type))] as string[];
                        return (
                            <Link key={fav.id} href={`/spaces/${branch.id}`}
                                className="group flex flex-col overflow-hidden rounded-[2rem] bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 transition-all hover:border-brand-500/50 hover:shadow-[0_10px_40px_rgba(255,91,4,0.1)] hover:-translate-y-1">
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-dark-800">
                                    <Image src={imageUrl} alt={branch.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        sizes="(max-width: 640px) 100vw, 33vw" unoptimized={!imageUrl.startsWith("https://")} />
                                    <div className="absolute top-4 right-4 z-10 transition-transform hover:scale-110">
                                        <FavoriteButton branchId={branch.id} size="sm" />
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-dark-950/80 to-transparent pointer-events-none" />
                                </div>
                                <div className="flex flex-1 flex-col p-6">
                                    <div className="mb-2">
                                        <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-1">
                                            {branch.vendor?.companyName}
                                        </p>
                                        <h3 className="line-clamp-1 text-xl font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">
                                            {branch.name}
                                        </h3>
                                    </div>
                                    <p className="mb-4 line-clamp-1 text-sm text-slate-500 dark:text-slate-400 flex items-center">
                                        <svg className="mr-1.5 h-4 w-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                        </svg>
                                        {branch.address} · {formatCity(branch.city)}
                                    </p>
                                    <div className="mt-auto">
                                        {types.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {types.map((t: string) => (
                                                    <span key={t} className="rounded-full bg-dark-800 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                                                        {formatServiceType(t)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
