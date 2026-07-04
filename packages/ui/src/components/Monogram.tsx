"use client";

import * as React from "react";

export interface MonogramProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  /** "gradient" = dégradé DA officiel · "white" = monochrome clair · "current" = couleur héritée */
  variant?: "gradient" | "white" | "current";
}

const MAIN_PATH =
  "M4120 8185 c0 -804 4 -1335 9 -1335 5 0 20 17 32 38 13 20 124 189 246 375 l223 338 0 695 0 694 949 0 c587 0 988 -4 1052 -10 481 -49 883 -338 1098 -791 91 -189 131 -375 131 -600 0 -510 -250 -948 -692 -1211 -40 -24 -73 -37 -78 -32 -4 5 -44 65 -88 134 -43 69 -119 187 -168 263 -148 229 -245 382 -564 886 l-305 481 -241 0 -242 0 -129 -202 c-72 -112 -199 -311 -283 -443 -163 -254 -524 -817 -723 -1125 -196 -303 -377 -589 -383 -605 -5 -13 29 -15 285 -15 l290 0 12 23 c6 12 35 58 64 102 76 116 710 1091 924 1423 l183 283 28 -38 c25 -34 171 -262 700 -1088 91 -143 230 -360 309 -482 l142 -221 67 18 c447 124 847 419 1100 810 123 190 231 453 272 668 41 211 44 509 6 717 -52 293 -182 590 -364 835 -71 95 -234 264 -332 343 -221 178 -503 313 -795 379 l-100 22 -1317 3 -1318 3 0 -1335z";
const NOTCH_PATH =
  "M5540 6220 c0 -9 152 -249 262 -412 l59 -88 274 0 c151 0 275 2 275 5 0 5 -126 204 -253 398 l-70 107 -273 0 c-167 0 -274 -4 -274 -10z";

/**
 * Monogramme Digital Access — géométrie officielle (« D » enveloppant un « A »).
 * Chaque instance possède son propre id de dégradé (useId) : un démontage animé
 * ne casse jamais le rendu des autres instances.
 */
export function Monogram({
  size = 40,
  variant = "gradient",
  ...props
}: MonogramProps) {
  const gid = React.useId();
  const fill =
    variant === "gradient"
      ? `url(#${gid})`
      : variant === "white"
        ? "#FFFFFF"
        : "currentColor";

  return (
    <svg
      width={size}
      height={size}
      viewBox="382 288 469 408"
      fill="none"
      role="img"
      aria-label="Digital Access"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {variant === "gradient" && (
        <defs>
          <linearGradient
            id={gid}
            gradientUnits="userSpaceOnUse"
            x1="351"
            y1="689"
            x2="877"
            y2="300"
          >
            <stop offset="0" stopColor="#7B34F8" />
            <stop offset="0.35" stopColor="#4340E8" />
            <stop offset="0.65" stopColor="#2072E8" />
            <stop offset="1" stopColor="#12C7E8" />
          </linearGradient>
        </defs>
      )}
      <g transform="translate(0,1254) scale(0.1,-0.1)" fill={fill}>
        <path d={MAIN_PATH} />
        <path d={NOTCH_PATH} />
      </g>
    </svg>
  );
}
