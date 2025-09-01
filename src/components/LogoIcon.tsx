// src/components/LogoIcon.jsx
import React from "react";

export const LogoIcon = ({
  width = 64,
  height = 64,
  className = "",
  // optional overrides for the two main colors
  bgColor = "#0A84FF",
  lockColor = "#FFFFFF",
  keyholeColor = "#0A84FF",
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    width={width}
    height={height}
    className={className}
    role="img"
    aria-label="Password manager icon"
  >
    {/* Background rounded square */}
    <rect x="4" y="4" width="56" height="56" rx="8" ry="8" fill={bgColor} />
    {/* Lock body */}
    <rect x="18" y="28" width="28" height="24" rx="4" ry="4" fill={lockColor} />
    {/* Shackle */}
    <path
      d="M32 20c-6.627 0-12 5.373-12 12v4h4v-4c0-4.418 3.582-8 8-8s8 3.582 8 8v4h4v-4c0-6.627-5.373-12-12-12z"
      fill={lockColor}
    />
    {/* Keyhole */}
    <circle cx="32" cy="38" r="3" fill={keyholeColor} />
    <rect x="31" y="41" width="2" height="6" fill={keyholeColor} />
  </svg>
);
