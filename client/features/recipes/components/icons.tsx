import type { SVGProps } from "react";

const Stroke = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  />
);

export const BreadIcon = (props: SVGProps<SVGSVGElement>) => (
  <Stroke {...props}>
    <path
      d="M5 11a4 4 0 0 1 1-7.8c1.8-.9 3.6-.9 6-.9s4.2 0 6 .9A4 4 0 0 1 19 11v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"
      transform="translate(0 1)"
    />
    <path d="M9 13v4M15 13v4" />
  </Stroke>
);

export const PlusIcon = (props: SVGProps<SVGSVGElement>) => (
  <Stroke strokeWidth={1.6} {...props}>
    <path d="M12 5v14M5 12h14" />
  </Stroke>
);
