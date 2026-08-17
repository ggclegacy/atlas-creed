import type { SVGProps } from "react";

export function AtlasMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
      <path d="M16 3 27 27H5L16 3Z" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="m10.3 20.5 5.7-13 5.7 13M8.2 23.5h15.6"
        stroke="currentColor"
        strokeWidth="1"
      />
      <path d="M16 11.8v10.7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
