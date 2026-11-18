import type { SVGProps } from "react";

/** Inline stroke icons (§5): round caps, `currentColor`, always decorative. */
type IconProps = SVGProps<SVGSVGElement>;

const Stroke = ({ strokeWidth = 2, children, ...props }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    {children}
  </svg>
);

export const ArrowIcon = (props: IconProps) => (
  <Stroke strokeWidth={2.2} {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Stroke>
);

export const PhoneIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
  </Stroke>
);

export const CloseIcon = (props: IconProps) => (
  <Stroke {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Stroke>
);

/** The image placeholder's loaf. `slices` adds the hero's score marks. */
export const BreadIcon = ({ slices = false, ...props }: IconProps & { slices?: boolean }) => (
  <Stroke strokeWidth={1.5} {...props}>
    <path d="M4 11a8 5 0 0 1 16 0v1a2 2 0 0 1-2 2v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4a2 2 0 0 1-2-2z" />
    {slices && <path d="M9 14v3M12 14v3M15 14v3" />}
  </Stroke>
);
