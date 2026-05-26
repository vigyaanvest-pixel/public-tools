interface Props {
  size?: number;
  radius?: number;
}

export function BrandIcon({ size = 40, radius = 10 }: Props) {
  const r = radius;
  const s = size;
  const id = `vv-grad-${s}`;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0, display: "block" }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      {/* Background */}
      <rect width="40" height="40" rx={r} fill={`url(#${id})`} />
      {/* Chart line forming a V — goes down-right then up-right, like a market recovery */}
      <polyline
        points="8,13 20,27 32,13"
        fill="none"
        stroke="#0d0f14"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Small upward tick at the end to suggest uptrend continuation */}
      <line
        x1="32" y1="13" x2="35" y2="9"
        stroke="#0d0f14"
        strokeWidth="3.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
