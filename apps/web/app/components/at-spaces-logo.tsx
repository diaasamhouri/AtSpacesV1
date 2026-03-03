interface AtSpacesLogoProps {
  variant?: "brand" | "white" | "mono";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CONFIG = {
  sm: { symbol: 22, text: "text-lg", gap: "gap-1.5" },
  md: { symbol: 28, text: "text-xl", gap: "gap-2" },
  lg: { symbol: 36, text: "text-2xl", gap: "gap-2.5" },
} as const;

const VARIANT_CONFIG = {
  brand: { symbolColor: "#FF5B04", textClass: "text-gray-900 dark:text-white", accentClass: "text-brand-500" },
  white: { symbolColor: "#FFFFFF", textClass: "text-white", accentClass: "text-white" },
  mono: { symbolColor: "currentColor", textClass: "", accentClass: "" },
} as const;

/**
 * AtSpaces logo — geometric room symbol + wordmark.
 * The symbol is a minimal outlined room with door, window, and handle.
 */
export function AtSpacesLogo({
  variant = "brand",
  size = "sm",
  className,
}: AtSpacesLogoProps) {
  const { symbol, text, gap } = SIZE_CONFIG[size];
  const { symbolColor, textClass, accentClass } = VARIANT_CONFIG[variant];

  return (
    <span className={`inline-flex items-center ${gap} ${className ?? ""}`} aria-label="AtSpaces">
      <AtSpacesSymbol variant={variant} size={symbol} />
      <span className={`font-extrabold tracking-tight ${text} ${textClass}`}>
        At<span className={accentClass || undefined}>Spaces</span>
      </span>
    </span>
  );
}

/**
 * Compact symbol mark — geometric room icon with door and window.
 * Used for favicon and small spaces.
 */
export function AtSpacesSymbol({
  variant = "brand",
  size = 32,
  className,
}: {
  variant?: "brand" | "white" | "mono";
  size?: number;
  className?: string;
}) {
  const color = VARIANT_CONFIG[variant].symbolColor;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-hidden="true"
    >
      {/* Outer room — rounded rectangle */}
      <rect x="6" y="6" width="36" height="36" rx="4" />
      {/* Door — vertical line from bottom rising ~50% */}
      <line x1="24" y1="42" x2="24" y2="23" />
      {/* Door handle */}
      <circle cx="27.5" cy="33" r="1.5" fill={color} stroke="none" />
      {/* Window — small square top-left */}
      <rect x="12" y="12" width="10" height="10" rx="2" />
    </svg>
  );
}
