import type { ReactNode } from "react";

type Props = {
  id?: string;
  surface?: boolean;
  /** Below-the-fold sections skip layout until they are near the viewport (content-visibility). */
  lazy?: boolean;
  className?: string;
  children: ReactNode;
  "aria-labelledby"?: string;
};

/** Page section: 80px vertical padding on desktop, 56px on mobile; optional surface background with borders. */
export function Section({
  id,
  surface = false,
  lazy = false,
  className = "",
  children,
  ...rest
}: Props) {
  const bg = surface ? "bg-surface border-y border-border" : "";
  const cv = lazy ? "cv-auto" : "";
  return (
    <section id={id} className={`py-14 md:py-20 ${bg} ${cv} ${className}`} {...rest}>
      <div className="container-site">{children}</div>
    </section>
  );
}
