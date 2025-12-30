import React from "react"

const UpArrowIcon: React.FC = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-12 h-12"
  >
    <defs>
      <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#4ADE80" />
        <stop offset="100%" stopColor="#22C55E" />
      </linearGradient>
      <filter id="shadowGreen">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
      </filter>
    </defs>
    <g filter="url(#shadowGreen)">
      <rect x="18" y="35" width="12" height="5" rx="2.5" fill="url(#greenGradient)" />
      <rect x="18" y="27" width="12" height="5" rx="2.5" fill="url(#greenGradient)" />
      <rect x="18" y="19" width="12" height="5" rx="2.5" fill="url(#greenGradient)" />
      <path d="M24 10 L34 20 L14 20 Z" fill="url(#greenGradient)" />
    </g>
  </svg>
)

export default UpArrowIcon
