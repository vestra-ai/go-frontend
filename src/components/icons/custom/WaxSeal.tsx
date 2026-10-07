import { useId } from "react";

export interface WaxSealProps extends React.SVGProps<SVGSVGElement> {
  ring: string;
  month: string;
  days: string;
}

const BLOB =
  "M82.6 51.1 Q80.5 56.1 79.1 61.2 Q77.6 66.3 73.5 69.6 Q69.3 72.9 65.4 76.4 Q61.5 79.9 56.5 82.2 Q51.5 84.4 46.2 82.8 Q40.9 81.2 35.8 80.5 Q30.6 79.8 26.7 76.3 Q22.7 72.8 18.9 69.4 Q15.0 65.9 12.3 61.3 Q9.7 56.7 10.0 51.3 Q10.3 46.0 10.5 40.8 Q10.6 35.6 12.3 30.5 Q13.9 25.3 18.2 22.1 Q22.5 18.9 26.3 15.0 Q30.1 11.1 35.4 10.0 Q40.7 8.8 46.1 8.3 Q51.5 7.8 56.5 9.9 Q61.5 12.0 65.8 15.1 Q70.1 18.2 75.2 21.1 Q80.4 23.9 80.3 29.9 Q80.1 36.0 82.4 41.0 Q84.7 46.0 82.6 51.1Z";

export function WaxSeal({ ring, month, days, ...props }: WaxSealProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = (name: string) => `${uid}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  return (
    <svg aria-hidden width={92} height={92} viewBox="0 0 92 92" {...props}>
      <defs>
        <radialGradient id={id("wax")} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#F0A184" />
          <stop offset="38%" stopColor="#D4694E" />
          <stop offset="78%" stopColor="#A9452E" />
          <stop offset="100%" stopColor="#7E2E1D" />
        </radialGradient>
        <radialGradient id={id("well")} cx="62%" cy="70%" r="75%">
          <stop offset="0%" stopColor="#D97456" />
          <stop offset="70%" stopColor="#BC5539" />
          <stop offset="100%" stopColor="#9C3D27" />
        </radialGradient>
        <linearGradient id={id("text")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF4EE" />
          <stop offset="100%" stopColor="#F6C8B6" />
        </linearGradient>
        <linearGradient id={id("rim")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7E2E1D" stopOpacity={0.75} />
          <stop offset="100%" stopColor="#FFD2C2" stopOpacity={0.8} />
        </linearGradient>
        <filter id={id("shadow")} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx={1.5} dy={4} stdDeviation={3.2} floodColor="#2A0E07" floodOpacity={0.45} />
        </filter>
        <filter id={id("soft")}>
          <feGaussianBlur stdDeviation={2.2} />
        </filter>
        <path id={id("ring")} d="M46 46 m-23.5 0 a23.5 23.5 0 1 1 47.0 0 a23.5 23.5 0 1 1 -47.0 0" />
      </defs>
      <g filter={url("shadow")}>
        <path d={BLOB} fill={url("wax")} />
      </g>
      <path d={BLOB} fill="none" stroke="#FFD9CB" strokeOpacity={0.35} strokeWidth={0.8} transform="translate(-0.4 -0.6)" />
      <circle cx={46} cy={46} r={30} fill={url("well")} />
      <circle cx={46} cy={46} r={30} fill="none" stroke={url("rim")} strokeWidth={1.6} />
      <circle cx={46} cy={46} r={17.5} fill="none" stroke="#7E2E1D" strokeOpacity={0.45} strokeWidth={1.2} transform="translate(0.4 0.6)" />
      <circle cx={46} cy={46} r={17.5} fill="none" stroke="#FFE3D8" strokeOpacity={0.7} strokeWidth={0.9} />
      <text transform="translate(0.5 0.7)" fill="#6E2414" opacity={0.5} fontSize={7} fontWeight={800} letterSpacing={1.2}>
        <textPath href={`#${id("ring")}`} textLength={145} lengthAdjust="spacing">
          {ring}
        </textPath>
      </text>
      <text fill={url("text")} fontSize={7} fontWeight={800} letterSpacing={1.2}>
        <textPath href={`#${id("ring")}`} textLength={145} lengthAdjust="spacing">
          {ring}
        </textPath>
      </text>
      <text x={46} y={43.7} textAnchor="middle" fill="#6E2414" opacity={0.55} fontSize={7} fontWeight={800} letterSpacing={1.2}>
        {month}
      </text>
      <text x={46} y={42.6} textAnchor="middle" fill="#FFE9E0" opacity={0.5} fontSize={7} fontWeight={800} letterSpacing={1.2}>
        {month}
      </text>
      <text x={46} y={43} textAnchor="middle" fill={url("text")} fontSize={7} fontWeight={800} letterSpacing={1.2}>
        {month}
      </text>
      <text x={46} y={55.7} textAnchor="middle" fill="#6E2414" opacity={0.55} fontSize={13} fontWeight={800} letterSpacing={-0.3}>
        {days}
      </text>
      <text x={46} y={54.6} textAnchor="middle" fill="#FFE9E0" opacity={0.5} fontSize={13} fontWeight={800} letterSpacing={-0.3}>
        {days}
      </text>
      <text x={46} y={55} textAnchor="middle" fill={url("text")} fontSize={13} fontWeight={800} letterSpacing={-0.3}>
        {days}
      </text>
      <ellipse cx={33} cy={28} rx={14} ry={7} fill="#FFFFFF" opacity={0.28} transform="rotate(-30 33 28)" filter={url("soft")} />
      <ellipse cx={29} cy={24} rx={4} ry={2} fill="#FFFFFF" opacity={0.55} transform="rotate(-35 29 24)" filter={url("soft")} />
    </svg>
  );
}
