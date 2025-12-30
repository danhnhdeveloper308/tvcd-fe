import React from "react"

const DownArrowIcon: React.FC = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-12 h-12"
  >
    <defs>
      <filter id="shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
      </filter>
    </defs>
    <g filter="url(#shadow)">
      <rect x="18" y="8" width="12" height="5" rx="2.5" fill="#ef4444" />
      <rect x="18" y="16" width="12" height="5" rx="2.5" fill="#ef4444" />
      <rect x="18" y="24" width="12" height="5" rx="2.5" fill="#ef4444" />
      <path d="M24 38 L34 28 L14 28 Z" fill="#ef4444" />
    </g>
  </svg>
)

export default DownArrowIcon