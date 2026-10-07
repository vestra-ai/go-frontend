import type { SVGProps } from "react";
const SvgStopwatch = (props: SVGProps<SVGSVGElement>) => (
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
    <circle cx={12} cy={13} r={8} />
    <path d="M12 9v4l2.5 2M10 2h4" />
  </svg>
);
export default SvgStopwatch;
