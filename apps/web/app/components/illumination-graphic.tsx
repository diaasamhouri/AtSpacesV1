interface IlluminationGraphicProps {
  position?: "top-right" | "bottom-left";
  className?: string;
}

/**
 * Decorative overlapping circle arcs inspired by brand guidelines (page 27).
 * Renders 3-4 partial circle outlines in orange (#FF5B04) and bright gray (#E3EEEF).
 * Always absolute-positioned, pointer-events-none, and aria-hidden.
 */
export function IlluminationGraphic({
  position = "top-right",
  className,
}: IlluminationGraphicProps) {
  const positionClasses =
    position === "top-right"
      ? "-top-20 -right-20 sm:-top-32 sm:-right-32"
      : "-bottom-20 -left-20 sm:-bottom-32 sm:-left-32";

  return (
    <svg
      viewBox="0 0 400 400"
      className={`absolute ${positionClasses} w-64 h-64 sm:w-96 sm:h-96 pointer-events-none ${className ?? ""}`}
      fill="none"
      aria-hidden="true"
    >
      {/* Large outer arc — bright gray */}
      <circle
        cx="200"
        cy="200"
        r="180"
        stroke="#E3EEEF"
        strokeWidth="1.5"
        strokeDasharray="565 1131"
        strokeDashoffset={position === "top-right" ? "0" : "565"}
        opacity="0.6"
      />
      {/* Medium arc — orange */}
      <circle
        cx="200"
        cy="200"
        r="140"
        stroke="#FF5B04"
        strokeWidth="1.5"
        strokeDasharray="440 880"
        strokeDashoffset={position === "top-right" ? "-50" : "490"}
        opacity="0.35"
      />
      {/* Smaller arc — bright gray */}
      <circle
        cx="200"
        cy="200"
        r="100"
        stroke="#E3EEEF"
        strokeWidth="1.5"
        strokeDasharray="314 628"
        strokeDashoffset={position === "top-right" ? "-20" : "334"}
        opacity="0.5"
      />
      {/* Inner arc — orange accent */}
      <circle
        cx="200"
        cy="200"
        r="60"
        stroke="#FF5B04"
        strokeWidth="1.5"
        strokeDasharray="188 377"
        strokeDashoffset={position === "top-right" ? "-40" : "228"}
        opacity="0.25"
      />
    </svg>
  );
}
