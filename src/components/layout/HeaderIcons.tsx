type IconProps = {
  className?: string;
};

/** Figma header icons — stroke uses currentColor (text/primary). */

export function IconSearch({ className }: IconProps) {
  return (
    <span className={`relative inline-block h-[15px] w-[13px] shrink-0 ${className ?? ""}`}>
      <svg
        className="absolute left-[2.1px] top-[3.2px]"
        width="7.589"
        height="7.589"
        viewBox="0 0 7.58906 7.58931"
        fill="none"
        aria-hidden
      >
        <path
          d="M3.66138 6.78693C5.38757 6.78693 6.78693 5.38758 6.78693 3.66138C6.78693 1.93519 5.38757 0.535835 3.66138 0.535835C1.93519 0.535835 0.535835 1.93519 0.535835 3.66138C0.535835 5.38758 1.93519 6.78693 3.66138 6.78693Z"
          stroke="currentColor"
          strokeWidth="1.07167"
        />
      </svg>
      <svg
        className="absolute left-[8.9px] top-[10px]"
        width="2.461"
        height="2.461"
        viewBox="0 0 2.46102 2.46103"
        fill="none"
        aria-hidden
      >
        <path
          d="M1.70368 1.70368L0.378893 0.378892"
          stroke="currentColor"
          strokeWidth="1.07167"
        />
      </svg>
    </span>
  );
}

export function IconTruck({ className }: IconProps) {
  return (
    <span className={`relative inline-block size-[18px] shrink-0 ${className ?? ""}`}>
      <svg
        className="absolute left-[0.8px] top-[3px]"
        width="15.878"
        height="8.408"
        viewBox="0 0 15.8777 8.40837"
        fill="none"
        aria-hidden
      >
        <path
          d="M9.19584 7.485V0.6375H0.6375V7.485H9.19584ZM9.19584 7.485H14.4625V4.995L12.4875 3.1275H9.19584V7.485Z"
          stroke="currentColor"
          strokeWidth="1.275"
        />
      </svg>
      <svg
        className="absolute left-[3px] top-[12px]"
        width="3.255"
        height="3.255"
        viewBox="0 0 3.25488 3.255"
        fill="none"
        aria-hidden
      >
        <path
          d="M1.5375 2.4375C2.03456 2.4375 2.4375 2.03456 2.4375 1.5375C2.4375 1.04044 2.03456 0.6375 1.5375 0.6375C1.04045 0.6375 0.6375 1.04044 0.6375 1.5375C0.6375 2.03456 1.04045 2.4375 1.5375 2.4375Z"
          stroke="currentColor"
          strokeWidth="1.275"
        />
      </svg>
      <svg
        className="absolute left-[12px] top-[12px]"
        width="3.255"
        height="3.255"
        viewBox="0 0 3.25488 3.255"
        fill="none"
        aria-hidden
      >
        <path
          d="M1.5375 2.4375C2.03456 2.4375 2.4375 2.03456 2.4375 1.5375C2.4375 1.04044 2.03456 0.6375 1.5375 0.6375C1.04045 0.6375 0.6375 1.04044 0.6375 1.5375C0.6375 2.03456 1.04045 2.4375 1.5375 2.4375Z"
          stroke="currentColor"
          strokeWidth="1.275"
        />
      </svg>
    </span>
  );
}

export function IconUser({ className }: IconProps) {
  return (
    <span className={`relative inline-block size-[18px] shrink-0 ${className ?? ""}`}>
      <svg
        className="absolute left-[6px] top-[3px]"
        width="6.159"
        height="6.159"
        viewBox="0 0 6.15923 6.15937"
        fill="none"
        aria-hidden
      >
        <path
          d="M2.8875 5.1375C4.13014 5.1375 5.1375 4.13014 5.1375 2.8875C5.1375 1.64486 4.13014 0.6375 2.8875 0.6375C1.64486 0.6375 0.6375 1.64486 0.6375 2.8875C0.6375 4.13014 1.64486 5.1375 2.8875 5.1375Z"
          stroke="currentColor"
          strokeWidth="1.275"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        className="absolute left-[3px] top-[11px]"
        width="12.091"
        height="5"
        viewBox="0 0 12.091 5.00036"
        fill="none"
        aria-hidden
      >
        <path
          d="M0.637639 3.92893C1.15193 1.66607 3.20907 0.6375 5.7805 0.6375C8.35193 0.6375 10.4091 1.66607 10.9234 3.92893"
          stroke="currentColor"
          strokeWidth="1.275"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function IconPin({ className }: IconProps) {
  return (
    <span className={`relative inline-block size-[18px] shrink-0 ${className ?? ""}`}>
      <svg
        className="absolute left-[3.8px] top-[2.3px]"
        width="10.58"
        height="14.368"
        viewBox="0 0 10.5795 14.3677"
        fill="none"
        aria-hidden
      >
        <path
          d="M5.23125 13.3734C5.23125 13.3734 9.825 9.2175 9.825 5.32969C9.825 4.7135 9.70618 4.10335 9.47535 3.53406C9.24444 2.96478 8.90608 2.44752 8.47952 2.01181C8.05295 1.5761 7.54654 1.23048 6.9892 0.994668C6.43186 0.758867 5.83451 0.6375 5.23125 0.6375C4.62799 0.6375 4.03064 0.758867 3.4733 0.994668C2.91596 1.23048 2.40955 1.5761 1.98297 2.01181C1.55641 2.44752 1.21803 2.96478 0.987181 3.53406C0.756321 4.10335 0.6375 4.7135 0.6375 5.32969C0.6375 9.2175 5.23125 13.3734 5.23125 13.3734Z"
          stroke="currentColor"
          strokeWidth="1.275"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        className="absolute left-[7px] top-[5.6px]"
        width="4.123"
        height="4.123"
        viewBox="0 0 4.123 4.12312"
        fill="none"
        aria-hidden
      >
        <path
          d="M1.905 3.1725C2.60502 3.1725 3.1725 2.60502 3.1725 1.905C3.1725 1.20498 2.60502 0.6375 1.905 0.6375C1.20498 0.6375 0.6375 1.20498 0.6375 1.905C0.6375 2.60502 1.20498 3.1725 1.905 3.1725Z"
          stroke="currentColor"
          strokeWidth="1.275"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function IconTheme({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
    >
      <path
        d="M15.75 9.6C15.6305 10.8758 15.1504 12.0912 14.3656 13.1042C13.5809 14.1173 12.5241 14.886 11.3186 15.3205C10.1132 15.7551 8.80896 15.8376 7.55837 15.5583C6.30778 15.2791 5.16252 14.6496 4.25644 13.7436C3.35036 12.8375 2.72091 11.6922 2.44165 10.4416C2.1624 9.19104 2.24488 7.8868 2.67945 6.68136C3.11403 5.47591 3.88275 4.41907 4.89575 3.63436C5.90876 2.84964 7.1242 2.36948 8.4 2.25C7.64175 3.261 7.27362 4.51159 7.36321 5.77217C7.45279 7.03274 7.99408 8.2187 8.88769 9.11231C9.7813 10.0059 10.9673 10.5472 12.2278 10.6368C13.4884 10.7264 14.739 10.3583 15.75 9.6Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconCart({ className }: IconProps) {
  return (
    <span className={`relative inline-block size-[20px] shrink-0 ${className ?? ""}`}>
      <svg
        className="absolute left-[0.8px] top-[1.7px]"
        width="16.786"
        height="11.393"
        viewBox="0 0 16.7858 11.393"
        fill="none"
        aria-hidden
      >
        <path
          d="M0.7115 0.7115H2.90886L4.52027 9.54871C4.57204 9.81704 4.71801 10.0588 4.93244 10.2311C5.14687 10.4033 5.41596 10.4952 5.6922 10.4903H12.3575C12.6338 10.4952 12.9028 10.4033 13.1173 10.2311C13.3318 10.0588 13.4778 9.81704 13.5294 9.54871L15.3606 3.60893H3.78781"
          stroke="currentColor"
          strokeWidth="1.423"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        className="absolute left-[6.4px] top-[15.6px]"
        width="2.615"
        height="2.615"
        viewBox="0 0 2.61467 2.61466"
        fill="none"
        aria-hidden
      >
        <path
          d="M1.30733 1.90316C1.63641 1.90316 1.90317 1.6364 1.90317 1.30733C1.90317 0.978262 1.63641 0.7115 1.30733 0.7115C0.978264 0.7115 0.7115 0.978262 0.7115 1.30733C0.7115 1.6364 0.978264 1.90316 1.30733 1.90316Z"
          stroke="currentColor"
          strokeWidth="1.423"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <svg
        className="absolute left-[13.9px] top-[15.6px]"
        width="2.615"
        height="2.615"
        viewBox="0 0 2.61467 2.61466"
        fill="none"
        aria-hidden
      >
        <path
          d="M1.30733 1.90316C1.63641 1.90316 1.90317 1.6364 1.90317 1.30733C1.90317 0.978262 1.63641 0.7115 1.30733 0.7115C0.978264 0.7115 0.7115 0.978262 0.7115 1.30733C0.7115 1.6364 0.978264 1.90316 1.30733 1.90316Z"
          stroke="currentColor"
          strokeWidth="1.423"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
