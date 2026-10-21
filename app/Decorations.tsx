// Simple inline SVG decorations and icons (no external assets). All are decorative only.

type SvgProps = { className?: string };

export function LaughingFace({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="28" fill="#FFD400" stroke="#111" strokeWidth="3" />
      <path d="M18 26 l6 -4 l6 4" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 26 l6 -4 l6 4" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 34 h30 a15 15 0 0 1 -30 0 z" fill="#FF4B39" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
      <path d="M22 35 h20" stroke="#fff" strokeWidth="4" />
      <path d="M10 30 q-4 8 0 12 q4 -4 0 -12 z" fill="#18BFF2" stroke="#111" strokeWidth="2" />
      <path d="M54 30 q4 8 0 12 q-4 -4 0 -12 z" fill="#18BFF2" stroke="#111" strokeWidth="2" />
    </svg>
  );
}

export function Star({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <path
        d="M20 3 l5 11 l12 1 l-9 8 l3 12 l-11 -6 l-11 6 l3 -12 l-9 -8 l12 -1 z"
        fill="#FFD400"
        stroke="#111"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Burst({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path
        d="M50 2 L58 30 L84 12 L70 40 L98 46 L72 58 L90 84 L60 72 L52 98 L42 72 L14 88 L28 60 L2 52 L28 42 L12 16 L40 30 Z"
        fill="#FF5BCB"
        stroke="#111"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Rays({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <g stroke="#111" strokeWidth="3.5" strokeLinecap="round">
        <path d="M20 4 v10" />
        <path d="M6 12 l7 6" />
        <path d="M34 12 l-7 6" />
      </g>
    </svg>
  );
}

export function WandIcon({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20 L15 9" />
        <path d="M17 3 v4 M15 5 h4" />
        <path d="M20 10 v3 M18.5 11.5 h3" />
        <path d="M10 3 v2 M9 4 h2" />
      </g>
    </svg>
  );
}

export function RefreshIcon({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 12 a8 8 0 0 1 -14 5.3" />
        <path d="M4 12 a8 8 0 0 1 14 -5.3" />
        <path d="M18 3 v4 h-4" />
        <path d="M6 21 v-4 h4" />
      </g>
    </svg>
  );
}

export function ClipboardIcon({ className }: SvgProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M16 8 V5 a2 2 0 0 0 -2 -2 H6 a2 2 0 0 0 -2 2 v10 a2 2 0 0 0 2 2 h2" />
      </g>
    </svg>
  );
}
