import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textSizeClass?: string;
}

export function LogoIcon({ size = 38, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.12)] select-none pointer-events-none"
      >
        {/* Soft elegant white background container card matching the source image */}
        <rect
          x="6"
          y="6"
          width="108"
          height="108"
          rx="25"
          fill="#FFFFFF"
          className="stroke-[#F1F5F9]"
          strokeWidth="1.5"
        />

        {/* The Document Sheet Card inside */}
        {/* Document outer stroke has dual color: bottom/right is red gradient while top/left is dark slate */}
        <rect
          x="28"
          y="24"
          width="64"
          height="72"
          rx="10"
          fill="#FFFFFF"
          stroke="url(#docify-document-border-gradient)"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />

        {/* Decorative corner curve matching the paper fold flap */}
        <path
          d="M74 24.5 L74 34.5 C74 36.5 75.5 38 77.5 38 L87.5 38"
          fill="none"
          stroke="url(#docify-document-border-gradient)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Soft horizontal text indicator placeholder lines */}
        <line x1="44" y1="42" x2="68" y2="42" stroke="#E2E8F0" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="44" y1="52" x2="68" y2="52" stroke="#E2E8F0" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="44" y1="62" x2="58" y2="62" stroke="#E2E8F0" strokeWidth="4.5" strokeLinecap="round" />

        {/* Elegant glowing Crimson Red handwritten signature */}
        <path
          d="M44 84 C48 84 50 72 52 72 C55 72 55 81 58 81 C60 81 61 78 63 78 C65 78 66 80 69 73"
          fill="none"
          stroke="url(#docify-signature-red)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-[0_1px_2.5px_rgba(239,68,68,0.45)]"
        />

        {/* Custom Diagonal Crimson Glossy Signature Pen */}
        {/* We place it over the canvas, pointing to (69, 73) where the signature ends */}
        {/* Angled beautiful glossy pen body */}
        <g transform="translate(69, 73) rotate(-35)">
          {/* Silver Metal Tip Collar */}
          <path
            d="M 0 0 L 10 -4.5 L 10 4.5 Z"
            fill="url(#docify-pen-silver)"
          />
          {/* Fine steel point */}
          <path
            d="M 0 0 L 3 -1.3 L 3 1.3 Z"
            fill="#334155"
          />
          {/* Black band divider */}
          <rect
            x="10"
            y="-5"
            width="2.5"
            height="10"
            fill="#0F172A"
          />
          {/* Shiny Red Pen Barrel Grip */}
          <path
            d="M 12.5 -5 L 48 -5.5 C 50.5 -5.5 52 -3.5 52 0 C 52 3.5 50.5 5.5 48 5.5 L 12.5 5 Z"
            fill="url(#docify-pen-red)"
          />
          {/* Steel Pocket Pen Clip overlay */}
          <path
            d="M 30 -1.5 L 46 -1.8 L 46 -3.5 L 30 -3 Z"
            fill="url(#docify-pen-clip)"
          />
          {/* Glassy reflection highlight */}
          <path
            d="M 14.5 -2.5 L 45 -2.7 L 45 -1 L 14.5 -1 Z"
            fill="#FFFFFF"
            opacity="0.33"
          />
        </g>

        {/* Unified gradients definition block */}
        <defs>
          {/* Custom Document Border Gradient: left/top is slate-800, right/bottom is gorgeous glossy red */}
          <linearGradient id="docify-document-border-gradient" x1="28" y1="24" x2="92" y2="96" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1E293B" />
            <stop offset="0.45" stopColor="#334155" />
            <stop offset="0.75" stopColor="#EF4444" />
            <stop offset="1" stopColor="#B91C1C" />
          </linearGradient>

          {/* Signature Ink Color */}
          <linearGradient id="docify-signature-red" x1="44" y1="72" x2="69" y2="84" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F43F5E" />
            <stop offset="1" stopColor="#E11D48" />
          </linearGradient>

          {/* Glossy Red Pen Gradient */}
          <linearGradient id="docify-pen-red" x1="12.5" y1="0" x2="52" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF3B5D" />
            <stop offset="0.3" stopColor="#E11D48" />
            <stop offset="1" stopColor="#9F1239" />
          </linearGradient>

          {/* Chrome / Silver Metallic Nib Gradient */}
          <linearGradient id="docify-pen-silver" x1="0" y1="0" x2="10" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E2E8F0" />
            <stop offset="0.5" stopColor="#94A3B8" />
            <stop offset="1" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Pocket Clip Silver */}
          <linearGradient id="docify-pen-clip" x1="30" y1="0" x2="46" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#94A3B8" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function Logo({ className = '', size = 38, showText = true, textSizeClass = 'text-xl' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <LogoIcon size={size} />
      {showText && (
        <span className={`font-display font-black tracking-tight ${textSizeClass}`}>
          <span className="text-[var(--text)]">mydoc</span>
          <span className="text-red-600 dark:text-red-500">ify</span>
        </span>
      )}
    </div>
  );
}
