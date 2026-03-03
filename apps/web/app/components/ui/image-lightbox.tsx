"use client";

import { useEffect, useCallback } from "react";

interface ImageLightboxProps {
    images: string[];
    currentIndex: number;
    onClose: () => void;
    onNavigate: (index: number) => void;
    apiBase?: string;
}

export default function ImageLightbox({
    images,
    currentIndex,
    onClose,
    onNavigate,
    apiBase = "",
}: ImageLightboxProps) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
            if (e.key === "ArrowRight" && currentIndex < images.length - 1) onNavigate(currentIndex + 1);
        },
        [currentIndex, images.length, onClose, onNavigate]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [handleKeyDown]);

    const src = images[currentIndex];
    const fullSrc = src?.startsWith("/") ? `${apiBase}${src}` : src;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative max-h-[90vh] max-w-[90vw]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute -top-10 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-gray-900 dark:text-white hover:bg-white/30 transition-colors"
                >
                    ✕
                </button>

                {/* Image */}
                <img
                    src={fullSrc}
                    alt={`Image ${currentIndex + 1} of ${images.length}`}
                    className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl"
                />

                {/* Counter */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-gray-900 dark:text-white/70">
                    {currentIndex + 1} / {images.length}
                </div>

                {/* Prev */}
                {currentIndex > 0 && (
                    <button
                        onClick={() => onNavigate(currentIndex - 1)}
                        className="absolute left-[-3rem] top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-gray-900 dark:text-white hover:bg-white/30 transition-colors text-xl"
                    >
                        ‹
                    </button>
                )}

                {/* Next */}
                {currentIndex < images.length - 1 && (
                    <button
                        onClick={() => onNavigate(currentIndex + 1)}
                        className="absolute right-[-3rem] top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-gray-900 dark:text-white hover:bg-white/30 transition-colors text-xl"
                    >
                        ›
                    </button>
                )}
            </div>
        </div>
    );
}
