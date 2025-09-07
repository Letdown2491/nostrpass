// src/components/LogoIcon.jsx
import React from "react";

export const LogoIcon = ({
  width = 64,
  height = 64,
  className = "align-middle",
  // optional overrides for the two main colors
  bgColor = "",
  lockColor = "rgba(87, 95, 207,1.0)",
  keyholeColor = "rgba(236, 240, 241,1.0)",
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
    <rect x="4" y="4" width="56" height="56" rx="8" ry="8" fill="none" />
    {/* Lock body */}
    <rect x="18" y="28" width="28" height="24" rx="4" ry="4" fill={lockColor} />
    {/* Shackle */}
    <path
      d="M32 20c-6.627 0-12 5.373-12 12v4h4v-4c0-4.418 3.582-8 8-8s8 3.582 8 8v4h4v-4c0-6.627-5.373-12-12-12z"
      fill={lockColor}
    />
    {/* Keyhole */}
    <circle cx="32" cy="36" r="3" fill={keyholeColor} />
    <rect x="31" y="39" width="2" height="6" fill={keyholeColor} />
  </svg>
);

export const OfflineFavicon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={props.width ?? 16}
    height={props.height ?? 16}
    viewBox="0 0 16 16"
    {...props}
  >
    {/* Background rectangle */}
    <rect width="16" height="16" rx="2" ry="2" fill="#64748b" />
    {/* Icon path */}
    <path
      d="M8 4a3 3 0 00-3 3v1H4v5h8V8h-1V7a3 3 0 00-3-3zm0 1a2 2 0 012 2v1H6V7a2 2 0 012-2z"
      fill="#fff"
    />
  </svg>
);

interface IconProps extends React.SVGProps<SVGSVGElement> {
  /** Width / height of the icon. */
  size?: number | string;
  /** Stroke or fill colour – defaults to `currentColor`. */
  color?: string;
}

export const RestoreIcon = ({
  size = 32,
  color = "currentColor",
  ...svgProps
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    stroke={color}
    strokeWidth={1}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...svgProps}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.207 2.293a1 1 0 0 1 0 1.414L10.914 5H12.5c4.652 0 8.5 3.848 8.5 8.5S17.152 22 12.5 22 4 18.152 4 13.5a1 1 0 1 1 2 0c0 3.548 2.952 6.5 6.5 6.5s6.5-2.952 6.5-6.5S16.048 7 12.5 7h-1.586l1.293 1.293a1 1 0 0 1-1.414 1.414l-3-3a1 1 0 0 1 0-1.414l3-3a1 1 0 0 1 1.414 0z" />
  </svg>
);

export const SpinnerIcon = ({
  size = 32,
  color = "currentColor",
  ...svgProps
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 38 38"
    xmlns="http://www.w3.org/2000/svg"
    stroke={color}
    className="animate-spin"
    aria-hidden="true"
    {...svgProps}
  >
    <g fill="none" fillRule="evenodd">
      <g transform="translate(1 1)" strokeWidth="2">
        <circle strokeOpacity=".5" cx="18" cy="18" r="18" />
        <path d="M36 18c0-9.94-8.06-18-18-18">
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 18 18"
            to="360 18 18"
            dur="0.9s"
            repeatCount="indefinite"
          />
        </path>
      </g>
    </g>
  </svg>
);

export const ShowIcon = ({
  size = 32,
  color = "currentColor",
  ...svgProps
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...svgProps}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer eye shape */}
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    {/* Pupil */}
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/**
 * An “eye‑slash” (hide) icon – eyeball with a diagonal line.
 *
 * Usage examples:
 *   <HideIcon size={20} color="#f87171" />
 *   <HideIcon className="text-slate-500 hover:text-slate-300" />
 */
export const HideIcon = ({
  size = 32,
  color = "currentColor",
  ...svgProps
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...svgProps}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer eye shape */}
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    {/* Pupil */}
    <circle cx="12" cy="12" r="3" />
    {/* Diagonal slash – 45° from bottom‑left to top‑right */}
    <line x1="4" y1="20" x2="20" y2="4" />
  </svg>
);

export const GenerateIcon = ({
  size = 32,
  color = "currentColor",
  ...svgProps
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 512 512"
    fill="{color}"
    stroke={color}
    xmlns="http://www.w3.org/2000/svg"
    {...svgProps}
  >
    {/* ------------------------------------------------------------------ */}
    {/*  The raw paths you gave – cleaned up a little for readability.      */}
    {/* ------------------------------------------------------------------ */}
    <g id="SVGRepo_iconCarrier">
      <style type="text/css">{".st0{fill:#ffffff;}"}</style>
      <g>
        <path
          className="st0"
          d="M449.528,105.602L288.459,8.989C278.469,2.994,267.232,0,255.993,0c-11.225,0-22.463,2.994-32.452,8.989 L62.471,105.602c-19.012,11.406-30.64,31.95-30.64,54.117v192.562c0,22.168,11.628,42.711,30.64,54.117l161.069,96.613 c9.989,5.988,21.228,8.989,32.452,8.989c11.239,0,22.476-3.001,32.466-8.989l161.069-96.613 c19.013-11.406,30.64-31.95,30.64-54.117V159.719C480.168,137.552,468.541,117.008,449.528,105.602z M250.595,492.733 c-6.028-0.745-11.936-2.712-17.321-5.948L72.206,390.172c-13.306-7.99-21.456-22.37-21.456-37.891V159.719 c0-6.022,1.242-11.862,3.518-17.233l196.328,117.76V492.733z M59.665,133.114c3.37-4.464,7.593-8.318,12.54-11.285l161.069-96.613 c6.996-4.196,14.85-6.291,22.718-6.291c7.882,0,15.737,2.095,22.732,6.291l161.069,96.613c4.942,2.967,9.171,6.821,12.54,11.285 L255.993,250.881L59.665,133.114z M461.249,352.281c0,15.521-8.15,29.901-21.456,37.891l-161.069,96.613 c-5.397,3.236-11.292,5.203-17.32,5.948V260.246l196.328-117.76c2.282,5.37,3.518,11.211,3.518,17.233V352.281z"
        />
        <path
          className="st0"
          d="M367.96,114.498c-10.809-8.01-28.626-8.204-39.784-0.45c-11.158,7.754-11.44,20.543-0.631,28.546 c10.822,8.002,28.626,8.203,39.784,0.45C378.487,135.282,378.769,122.507,367.96,114.498z"
        />
        <path
          className="st0"
          d="M183.676,112.289c-10.816-8.003-28.626-8.211-39.784-0.45c-11.158,7.754-11.44,20.536-0.631,28.538 c10.808,8.009,28.626,8.204,39.784,0.456C194.203,133.067,194.484,120.291,183.676,112.289z"
        />
        <path
          className="st0"
          d="M89.285,248.303c11.158,6.083,20.194,1.961,20.194-9.19c0-11.158-9.036-25.129-20.194-31.21 c-11.158-6.083-20.201-1.967-20.201,9.19C69.084,228.244,78.127,242.221,89.285,248.303z"
        />
        <path
          className="st0"
          d="M202.057,309.771c11.164,6.082,20.207,1.967,20.207-9.184c0-11.157-9.043-25.135-20.207-31.217 c-11.144-6.076-20.194-1.961-20.194,9.198C181.863,289.719,190.913,303.689,202.057,309.771z"
        />
        <path
          className="st0"
          d="M89.285,361.082c11.158,6.083,20.194,1.967,20.194-9.19c0-11.158-9.036-25.129-20.194-31.21 c-11.158-6.083-20.201-1.968-20.201,9.19C69.084,341.029,78.127,355,89.285,361.082z"
        />
        <path
          className="st0"
          d="M202.057,422.55c11.164,6.082,20.207,1.967,20.207-9.191c0-11.151-9.043-25.128-20.207-31.21 c-11.144-6.076-20.194-1.961-20.194,9.19C181.863,402.497,190.913,416.468,202.057,422.55z"
        />
        <path
          className="st0"
          d="M145.671,335.43c11.158,6.076,20.201,1.96,20.201-9.198c0-11.151-9.043-25.128-20.201-31.204 c-11.15-6.082-20.2-1.967-20.2,9.184C125.471,315.37,134.521,329.341,145.671,335.43z"
        />
        <path
          className="st0"
          d="M414.538,204.559c-11.158,6.082-20.194,20.052-20.194,31.21c0,11.158,9.036,15.273,20.194,9.191 c11.157-6.083,20.207-20.053,20.207-31.211C434.745,202.591,425.695,198.476,414.538,204.559z"
        />
        <path
          className="st0"
          d="M414.538,270.33c-11.158,6.09-20.194,20.053-20.194,31.211c0,11.158,9.036,15.273,20.194,9.198 c11.157-6.083,20.207-20.06,20.207-31.211C434.745,268.37,425.695,264.248,414.538,270.33z"
        />
        <path
          className="st0"
          d="M316.36,302.642c11.158-6.082,20.208-20.053,20.208-31.211c0-11.151-9.05-15.266-20.208-9.19 c-11.158,6.082-20.194,20.059-20.194,31.21C296.166,304.609,305.203,308.724,316.36,302.642z"
        />
        <path
          className="st0"
          d="M414.538,336.108c-11.158,6.082-20.194,20.053-20.194,31.204c0,11.158,9.036,15.273,20.194,9.198 c11.157-6.083,20.207-20.06,20.207-31.218C434.745,334.141,425.695,330.026,414.538,336.108z"
        />
        <path
          className="st0"
          d="M316.36,393.79c-11.158,6.082-20.194,20.053-20.194,31.211c0,11.15,9.037,15.266,20.194,9.184 c11.158-6.076,20.208-20.053,20.208-31.204C336.568,391.823,327.518,387.708,316.36,393.79z"
        />
        <path
          className="st0"
          d="M317.569,328.018c-11.158,6.076-20.194,20.053-20.194,31.204c0,11.158,9.036,15.273,20.194,9.191 c11.158-6.082,20.208-20.053,20.208-31.21C337.776,326.052,328.727,321.936,317.569,328.018z"
        />
      </g>
    </g>
  </svg>
);

/**
 * Camera‑shaped “scan” icon.
 *
 * Example usage:
 *   <ScanCodeIcon size={32} color="#34d399" />
 *   <ScanCodeIcon className="text-slate-500 hover:text-slate-300" />
 */
export const ScanCodeIcon = ({
  size = 32,
  color = "currentColor",
  ...svgProps
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...svgProps}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Camera body */}
    <rect x="2" y="5" width="20" height="14" rx="2" />
    {/* Lens */}
    <circle cx="12" cy="12" r="3" />
    {/* Top‑left “flash” / viewfinder */}
    <path d="M2 7h4" />
    {/* Bottom‑right “flash” / viewfinder */}
    <path d="M20 7h-4" />
    {/* Optional small “record” indicator – can be removed if you want a cleaner look */}
    <circle cx="18" cy="9" r="0.8" fill={color} stroke="none" />
  </svg>
);

export const SettingsIcon = ({
  size = 32,
  color = "currentColor",
  ...svgProps
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...svgProps}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Gear teeth */}
    <path d="M19.4 12.9c.04-.3.06-.61.06-.9s-.02-.6-.06-.9l2.03-1.58a.5.5 0 00.12-.63l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.03 7.03 0 00-1.56-.9l-.36-2.53A.5.5 0 0014.5 3h-4a.5.5 0 00-.5.42l-.36 2.53c-.57.22-1.1.52-1.56.9l-2.39-.96a.5.5 0 00-.6.22l-1.92 3.32a.5.5 0 00.12.63L4.6 11.1c-.04.3-.06.61-.06.9s.02.6.06.9l-2.03 1.58a.5.5 0 00-.12.63l1.92 3.32a.5.5 0 00.6.22l2.39-.96c.46.38 1 .68 1.56.9l.36 2.53a.5.5 0 00.5.42h4a.5.5 0 00.5-.42l.36-2.53c.57-.22 1.1-.52 1.56-.9l2.39.96a.5.5 0 00.6-.22l1.92-3.32a.5.5 0 00-.12-.63L19.4 12.9z" />
    {/* Center hub */}
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const NewLoginIcon = ({
  size = 32,
  color = "currentColor",
  ...svgProps
}: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...svgProps}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* ── Left side ── */}
    <line x1="0" y1="0" x2="0" y2="24" />

    {/* ── Bottom side ── */}
    <line x1="0" y1="24" x2="24" y2="24" />

    {/* ── Right side (lower 75 %) ── */}
    <line x1="24" y1="24" x2="24" y2="12" />

    {/* ── Top side (first 25 %) ── */}
    <line x1="0" y1="0" x2="12" y2="0" />

    {/* ── Maximised plus sign ── */}
    {/* Horizontal bar – from the end of the top line (x = 6) to the far right (x = 24) */}
    <line x1="12" y1="6" x2="24" y2="6" />
    {/* Vertical bar – from the top of the cut‑out (y = 0) down to where the right line resumes (y = 6) */}
    <line x1="18" y1="0" x2="18" y2="12" />
  </svg>
);
