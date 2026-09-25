import React from 'react';

interface PotLogoProps {
  className?: string;
  size?: number;
}

export const PotLogo: React.FC<PotLogoProps> = ({ className = 'w-10 h-10', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div
      style={style}
      className={`rounded-2xl bg-[#FAF8F5] border border-[#2D5A46]/20 p-1 flex items-center justify-center shadow-xs shrink-0 overflow-hidden ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Steam waves rising */}
        <path
          d="M40 32 C38 24 43 18 40 12"
          stroke="#E26D46"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M50 30 C48 21 53 15 50 8"
          stroke="#E26D46"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M60 32 C58 24 63 18 60 12"
          stroke="#E26D46"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Orange Lid Knob */}
        <rect x="46" y="34" width="8" height="3" rx="1.5" fill="#E26D46" />
        <rect x="48" y="37" width="4" height="2" fill="#C95632" />

        {/* Green Lid Dome */}
        <path d="M33 46 C33 39 67 39 67 46 Z" fill="#3D7358" />
        <rect x="30" y="45" width="40" height="2.5" rx="1" fill="#2E5C45" />

        {/* Handles */}
        <path d="M29 50 C25 50 25 56 29 56 Z" fill="#2E5C45" />
        <path d="M71 50 C75 50 75 56 71 56 Z" fill="#2E5C45" />

        {/* Main Pot Body */}
        <path
          d="M32 49 L37 72 C37.5 74 39.5 75.5 42 75.5 L58 75.5 C60.5 75.5 62.5 74 63 72 L68 49 Z"
          fill="#386B52"
        />
        <path
          d="M32 48.5 L68 48.5 L67.5 51 L32.5 51 Z"
          fill="#2D5A46"
        />

        {/* White Center Emblem */}
        <path d="M50 63 L47 70 L53 70 Z" fill="#FAF8F5" opacity="0.95" />
      </svg>
    </div>
  );
};
