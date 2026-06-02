import React from 'react'

// 1729 logo — center disc + 6 colored satellites, rotated 30°.
// centerColor defaults to var(--text-primary) so the center inverts
// with the app theme (white in dark mode, near-black in light mode).
const Logo = ({ size = 40, centerColor = 'var(--text-primary)', style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="1729"
    style={style}
  >
    <g transform="rotate(30 60 60)">
      <circle cx="60" cy="60" r="14" fill={centerColor} />
      <circle cx="60" cy="32" r="6" fill="#D9483F" />
      <circle cx="84.2" cy="46" r="6" fill="#E09740" />
      <circle cx="84.2" cy="74" r="6" fill="#7BAF53" />
      <circle cx="60" cy="88" r="6" fill="#4789C2" />
      <circle cx="35.8" cy="74" r="6" fill="#8062B5" />
      <circle cx="35.8" cy="46" r="6" fill="#C44A82" />
    </g>
  </svg>
)

export default Logo
