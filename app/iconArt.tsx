import { ImageResponse } from "next/og";

// App icon drawn in code: a yellow square with a simple black-outlined laughing face.
export function renderAppIcon(size: number): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFD400",
        }}
      >
        <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="#FFD400" stroke="#111111" strokeWidth="3.5" />
          <path
            d="M17 26 l6 -5 l6 5"
            fill="none"
            stroke="#111111"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M35 26 l6 -5 l6 5"
            fill="none"
            stroke="#111111"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 34 h32 a16 16 0 0 1 -32 0 z"
            fill="#FFFFFF"
            stroke="#111111"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
