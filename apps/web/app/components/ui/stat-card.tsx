import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: "up" | "down";
  trendValue?: string;
  color?: "brand" | "blue" | "purple" | "yellow" | "orange" | "indigo" | "teal" | "emerald" | "red" | "slate";
}

const colorMap: Record<string, { gradient: string; iconBg: string; iconText: string }> = {
  brand:   { gradient: "from-brand-500 to-orange-400", iconBg: "bg-brand-500/10", iconText: "text-brand-500" },
  blue:    { gradient: "from-blue-500 to-blue-400", iconBg: "bg-blue-500/10", iconText: "text-blue-400" },
  purple:  { gradient: "from-purple-500 to-purple-400", iconBg: "bg-purple-500/10", iconText: "text-purple-400" },
  yellow:  { gradient: "from-yellow-500 to-yellow-400", iconBg: "bg-yellow-500/10", iconText: "text-yellow-500" },
  orange:  { gradient: "from-orange-500 to-orange-400", iconBg: "bg-orange-500/10", iconText: "text-orange-500" },
  indigo:  { gradient: "from-indigo-500 to-indigo-400", iconBg: "bg-indigo-500/10", iconText: "text-indigo-400" },
  teal:    { gradient: "from-teal-500 to-teal-400", iconBg: "bg-teal-500/10", iconText: "text-teal-400" },
  emerald: { gradient: "from-emerald-500 to-emerald-400", iconBg: "bg-emerald-500/10", iconText: "text-emerald-400" },
  red:     { gradient: "from-red-500 to-red-400", iconBg: "bg-red-500/10", iconText: "text-red-400" },
  slate:   { gradient: "from-slate-500 to-slate-400", iconBg: "bg-slate-500/10", iconText: "text-slate-500 dark:text-slate-400" },
};

export default function StatCard({ label, value, icon, trend, trendValue, color = "brand" }: StatCardProps) {
  const fallback = { gradient: "from-brand-500 to-orange-400", iconBg: "bg-brand-500/10", iconText: "text-brand-500" };
  const c = colorMap[color] ?? fallback;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-slate-800 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-slate-700">
      {/* Gradient accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${c.gradient}`} />

      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">{value}</p>
          {trend && trendValue && (
            <div className={`mt-2 flex items-center gap-1 text-xs font-bold ${trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
              {trend === "up" ? (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${c.iconBg} ${c.iconText}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
