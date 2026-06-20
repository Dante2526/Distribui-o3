import React from 'react';

export const KaizenLogo = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 450 450"
    className={className}
    style={style}
  >
    <defs>
      <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="0" dy="10" stdDeviation="15" floodColor="#000000" floodOpacity="0.25" />
      </filter>
      <filter id="shadow-light" x="-10%" y="-10%" width="130%" height="130%">
        <feDropShadow dx="-5" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.15" />
      </filter>
    </defs>

    {/* Background Orange Circular */}
    <circle cx="225" cy="225" r="225" fill="#f77f00" />

    {/* Agrupando e centralizando o conteúdo no círculo */}
    <g transform="translate(-145, 10)">
      {/* Figure - Legs */}
      <path d="M 280 190 L 280 250 L 295 250 L 295 190 Z" fill="#2c2c38" />
      <path d="M 305 190 L 305 250 L 320 250 L 320 190 Z" fill="#2c2c38" />

      {/* Figure - Body */}
      <path d="M 290 140 L 360 140 L 380 210 L 280 210 Z" fill="#2c2c38" />

      {/* Figure - Head */}
      <circle cx="315" cy="100" r="28" fill="#0055ff" />
      
      {/* Figure - Hair */}
      <path d="M 290 85 C 290 60, 310 50, 320 60 C 330 70, 340 50, 350 60 C 360 70, 360 90, 350 90" fill="none" stroke="#607090" strokeWidth="2" />
      
      {/* Figure - Face details */}
      <path d="M 305 95 L 315 95 L 315 105 L 325 105" fill="none" stroke="#1c1c28" strokeWidth="2" strokeLinecap="round" />
      <path d="M 300 115 L 330 115" fill="none" stroke="#1c1c28" strokeWidth="1.5" strokeLinecap="round" />

      {/* Figure - Floating Box (Left) */}
      <g transform="translate(190, 160)">
        <rect x="0" y="0" width="70" height="25" fill="none" stroke="#000000" strokeWidth="3" rx="2" />
        <path d="M 20 10 L 30 20 L 50 0" fill="none" stroke="#0055ff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Figure - Arm */}
      <path d="M 345 150 L 265 185" fill="none" stroke="#0055ff" strokeWidth="16" strokeLinecap="round" />

      {/* The White Card */}
      <rect x="280" y="210" width="300" height="170" rx="8" fill="#ffffff" filter="url(#shadow)" />

      {/* Card - Grey Bars */}
      <rect x="315" y="225" width="180" height="10" rx="5" fill="#a0a0a0" />
      <rect x="315" y="245" width="200" height="10" rx="5" fill="#a0a0a0" />

      {/* Card - Colored Circles */}
      <circle cx="530" cy="230" r="12" fill="#32cd32" />
      <circle cx="530" cy="260" r="12" fill="#e60000" />
      <circle cx="530" cy="290" r="12" fill="#0055ff" />
      <circle cx="530" cy="320" r="12" fill="#9900ff" />

      {/* Card - Texts */}
      <text x="315" y="305" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="48" fill="#0055ff" letterSpacing="1">KAIZEN</text>
      <text x="315" y="335" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="22" fill="#f77f00">POR: NAYLAN</text>

      {/* Card - Small Checkbox Bottom Right */}
      <g transform="translate(520, 335)">
        <rect x="0" y="0" width="30" height="20" fill="none" stroke="#000000" strokeWidth="2" rx="2" />
        <path d="M 5 8 L 12 15 L 25 -2" fill="none" stroke="#0055ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="-10" y="22" width="50" height="4" fill="#d0d0d0" rx="2" />
      </g>
    </g>
  </svg>
);
