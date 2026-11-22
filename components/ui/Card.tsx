import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLElement> & {
  as?: "div" | "article" | "aside";
  lift?: boolean;
  radius?: 14 | 16 | 20;
  children: ReactNode;
};

export function Card({
  as = "div",
  lift = false,
  radius = 16,
  className = "",
  children,
  ...rest
}: Props) {
  const Tag = as;
  const r = radius === 14 ? "rounded-[14px]" : radius === 20 ? "rounded-[20px]" : "rounded-2xl";
  return (
    <Tag
      className={`border border-border bg-card ${r} ${lift ? "card-lift" : ""} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
