// src/components/LogoIcon.jsx
import React from "react";

export const LogoIcon = ({
  width = 64,
  height = 64,
  className = "align-middle",
  // optional overrides for the two main colors
  bgColor = "",
  lockColor = "rgba(155, 89, 182,1.0)",
  keyholeColor = "#FFFFFF",
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

export interface EditIconProps extends React.SVGProps<SVGSVGElement> {
  /** Width / height of the icon (default = 24 px) */
  size?: number | string;
  /** Fill colour (default = currentColor – inherits from parent) */
  color?: string;
}

export const EditIcon = ({
  size = 32,
  color = "currentColor",
  ...svgProps
}: EditIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...svgProps}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Pencil body */}
    <path d="M12 20h9" />
    {/* Pencil tip */}
    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
  </svg>
);

export interface DeleteIconProps extends React.SVGProps<SVGSVGElement> {
  /** Width / height of the icon (default = 24 px) */
  size?: number | string;
  /** Stroke colour (default = currentColor – inherits from parent) */
  color?: string;
}

export const DeleteIcon = ({
  size = 32,
  color = "currentColor",
  ...svgProps
}: DeleteIconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    fillOpacity="0.25"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...svgProps}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Lid */}
    <path d="M3 6h18" />
    {/* Body */}
    <rect x="5" y="6" width="14" height="16" rx="2" ry="2" />
    {/* Inner lines (the “X”) */}
    <line x1="10" y1="11" x2="14" y2="15" />
    <line x1="14" y1="11" x2="10" y2="15" />
  </svg>
);

export interface RestoreIconProps extends React.SVGProps<SVGSVGElement> {
  /** Width / height of the icon – defaults to 24 px */
  size?: number | string;
  /** Stroke colour – defaults to `currentColor` so it inherits the surrounding text colour */
  color?: string;
}

export const RestoreIcon = ({
  size = 32,
  color = "currentColor",
  ...svgProps
}: RestoreIconProps) => (
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
}: {
  size?: number | string;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 38 38"
    xmlns="http://www.w3.org/2000/svg"
    stroke={color}
    className="animate-spin"
    aria-hidden="true"
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
