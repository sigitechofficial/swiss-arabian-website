"use client";

/**
 * The assistant's face: a brand-coloured disc with a shopping bag and a sparkle, so it reads as the shop's assistant
 * and never as a person. `online` adds the small green status dot used in the header.
 */
export function AssistantAvatar({
  size = 28,
  accent,
  online = false,
  ring = false,
}: {
  size?: number;
  /** The brand colour class (bg-terra / bg-sapil-accent). */
  accent: string;
  online?: boolean;
  /** A light ring, for use on a coloured background. */
  ring?: boolean;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full text-white ${accent} ${
        ring ? "ring-2 ring-white/70" : "ring-1 ring-black/5"
      }`}
      style={{ width: size, height: size }}
      aria-hidden="true"
      data-assistant-avatar
    >
      <svg width={Math.round(size * 0.56)} height={Math.round(size * 0.56)} viewBox="0 0 24 24" fill="none">
        <path
          d="M5.5 8.5h13l-.9 10.2a1.5 1.5 0 0 1-1.5 1.3H7.9a1.5 1.5 0 0 1-1.5-1.3L5.5 8.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M9 10.5V7.5a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M12 12.6c.25 1.6.9 2.25 2.5 2.5-1.6.25-2.25.9-2.5 2.5-.25-1.6-.9-2.25-2.5-2.5 1.6-.25 2.25-.9 2.5-2.5Z" fill="currentColor" />
      </svg>
      {online ? (
        <span
          className="absolute -bottom-0.5 -end-0.5 size-3 rounded-full bg-emerald-400 ring-2 ring-white"
          data-assistant-online
        />
      ) : null}
    </span>
  );
}

/** The small icon on a welcome suggestion: a sparkle, a star or a parcel, in the order they are offered. */
export function SuggestionIcon({ index }: { index: number }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true } as const;
  if (index === 0) {
    return (
      <svg {...common}>
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  if (index === 1) {
    return (
      <svg {...common}>
        <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8-4.3-4.1 5.9-.9L12 3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4ZM4 7l8 4m0 0 8-4m-8 4v10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
