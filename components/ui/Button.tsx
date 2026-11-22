import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold whitespace-nowrap no-underline transition-[filter,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-accent-bg text-on-accent hover:brightness-95",
  secondary: "border border-border bg-transparent text-text hover:bg-surface",
};

const sizes: Record<Size, string> = {
  md: "h-[46px] px-5 text-[15px]",
  sm: "h-9 px-3.5 text-[13px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return [base, variants[variant], sizes[size], extra].filter(Boolean).join(" ");
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function ButtonLink({ href, variant, size, className = "", children, ...rest }: LinkProps) {
  return (
    <a href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </a>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function Button({
  variant,
  size,
  className = "",
  children,
  type = "button",
  ...rest
}: BtnProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

/** Square 46px icon-only link used in the hero. */
export function IconLink({ href, className = "", children, ...rest }: LinkProps) {
  return (
    <a
      href={href}
      className={`inline-flex h-[46px] w-[46px] items-center justify-center rounded-[10px] border border-border text-text transition-colors hover:bg-surface ${className}`}
      {...rest}
    >
      {children}
    </a>
  );
}
