import type { SVGProps } from "react";
const SvgBoard = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <rect width={16} height={18} x={4} y={3} rx={3} />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);
export default SvgBoard;
