"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function HomeSearchBar() {
    const [query, setQuery] = useState("");
    const [date, setDate] = useState("");
    const [duration, setDuration] = useState("");
    const [people, setPeople] = useState("");
    const [focused, setFocused] = useState<string | null>(null);
    const dateRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const params = new URLSearchParams();
        if (query.trim()) params.set("search", query.trim());
        if (date) params.set("date", date);
        if (duration) params.set("duration", duration);
        if (people) params.set("people", people);
        const qs = params.toString();
        router.push(qs ? `/spaces?${qs}` : "/spaces");
    }

    const isFocused = focused !== null;

    const displayDate = date
        ? new Date(date + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
          })
        : "";

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto mt-8">
            <div
                className={`relative flex items-center rounded-full bg-white/90 dark:bg-dark-900/80 backdrop-blur-md border transition-all duration-300 ${
                    isFocused
                        ? "border-brand-500/50 shadow-[0_0_24px_rgba(255,91,4,0.12)]"
                        : "border-slate-200 dark:border-slate-700 shadow-lg shadow-black/[0.04] dark:shadow-black/20"
                }`}
            >
                {/* Location field */}
                <div className="flex items-center flex-1 min-w-0 pl-5 gap-3">
                    <svg
                        className="h-5 w-5 shrink-0 text-brand-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                        />
                    </svg>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setFocused("query")}
                        onBlur={() => setFocused(null)}
                        placeholder="City, name, or type..."
                        className="w-full py-4 text-sm font-medium text-gray-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none bg-transparent border-none ring-0 focus:ring-0"
                    />
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

                {/* Date field — custom display with hidden native picker */}
                <button
                    type="button"
                    onClick={() => dateRef.current?.showPicker()}
                    className="flex items-center gap-2 px-4 py-4 cursor-pointer group relative"
                >
                    <svg
                        className="h-4 w-4 shrink-0 text-brand-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                        />
                    </svg>
                    <span
                        className={`text-sm font-medium whitespace-nowrap ${
                            date
                                ? "text-gray-900 dark:text-white"
                                : "text-slate-400 dark:text-slate-500"
                        }`}
                    >
                        {displayDate || "Pick a date"}
                    </span>
                    <input
                        ref={dateRef}
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        onFocus={() => setFocused("date")}
                        onBlur={() => setFocused(null)}
                        min={new Date().toISOString().split("T")[0]}
                        className="absolute inset-0 opacity-0 pointer-events-none"
                        tabIndex={-1}
                    />
                </button>

                {/* Divider */}
                <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

                {/* Duration field */}
                <div className="hidden sm:flex items-center gap-2 px-4">
                    <svg
                        className="h-4 w-4 shrink-0 text-brand-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                    </svg>
                    <select
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        onFocus={() => setFocused("duration")}
                        onBlur={() => setFocused(null)}
                        className={`py-4 text-sm font-medium bg-transparent border-none ring-0 focus:ring-0 focus:outline-none cursor-pointer ${
                            duration
                                ? "text-gray-900 dark:text-white"
                                : "text-slate-400 dark:text-slate-500"
                        }`}
                    >
                        <option value="">Duration</option>
                        <option value="1">1 hour</option>
                        <option value="2">2 hours</option>
                        <option value="3">3 hours</option>
                        <option value="4">Half Day (4h)</option>
                        <option value="8">Full Day</option>
                        <option value="week">Weekly</option>
                        <option value="month">Monthly</option>
                    </select>
                </div>

                {/* Divider */}
                <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

                {/* People field */}
                <div className="hidden sm:flex items-center gap-2 px-4">
                    <svg
                        className="h-4 w-4 shrink-0 text-brand-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                        />
                    </svg>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={people}
                        onChange={(e) => setPeople(e.target.value)}
                        onFocus={() => setFocused("people")}
                        onBlur={() => setFocused(null)}
                        placeholder="Guests"
                        className="w-20 py-4 text-sm font-medium text-gray-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none bg-transparent border-none ring-0 focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                </div>

                {/* Search button */}
                <button
                    type="submit"
                    className="shrink-0 mr-2 flex items-center gap-2 rounded-full bg-brand-500 active:scale-95 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-all shadow-[0_2px_8px_rgba(255,91,4,0.3)] hover:shadow-[0_4px_12px_rgba(255,91,4,0.4)]"
                >
                    <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2.5"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                        />
                    </svg>
                    Search
                </button>
            </div>
        </form>
    );
}
