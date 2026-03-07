"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import { toggleFavorite, checkFavorite } from "../../lib/reviews";

interface FavoriteButtonProps {
    branchId: string;
    size?: "sm" | "md";
}

export function FavoriteButton({ branchId, size = "md" }: FavoriteButtonProps) {
    const { user, token } = useAuth();
    const [favorited, setFavorited] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!token) return;
        checkFavorite(token, branchId).then((r) => setFavorited(r.favorited)).catch(() => { });
    }, [token, branchId]);

    async function handleToggle(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (!token || loading) return;
        setLoading(true);
        try {
            const result = await toggleFavorite(token, branchId);
            setFavorited(result.favorited);
        } catch { }
        setLoading(false);
    }

    if (!user) return null;

    const sizeClasses = size === "sm" ? "h-8 w-8" : "h-10 w-10";
    const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

    return (
        <button onClick={handleToggle} disabled={loading}
            className={`${sizeClasses} flex items-center justify-center rounded-full bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 transition-all hover:scale-110 hover:shadow-md ${favorited ? 'text-red-500' : 'text-slate-500 dark:text-slate-400 hover:text-red-400'} disabled:opacity-50`}
            title={favorited ? "Remove from favorites" : "Add to favorites"}>
            <svg className={iconSize} viewBox="0 0 24 24" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
        </button>
    );
}
