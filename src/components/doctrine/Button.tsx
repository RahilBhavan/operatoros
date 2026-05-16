import Link from "next/link";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "ground" | "mark" | "ghost" | "inverse";
type Size = "sm" | "md" | "lg";

type Common = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
};

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function variantClass(v: Variant) {
  return {
    ground: "btn",
    mark: "btn btn-mark",
    ghost: "btn btn-ghost",
    inverse: "btn btn-inverse",
  }[v];
}

function sizeClass(s: Size) {
  return {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
  }[s];
}

type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "ground",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(variantClass(variant), sizeClass(size), className)}
      {...rest}
    >
      {children}
    </button>
  );
}

type LinkButtonProps = Common & {
  href: string;
  prefetch?: boolean;
  external?: boolean;
};

export function LinkButton({
  variant = "ground",
  size = "md",
  className,
  children,
  href,
  prefetch,
  external,
}: LinkButtonProps) {
  const cls = clsx(variantClass(variant), sizeClass(size), className);
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} prefetch={prefetch} className={cls}>
      {children}
    </Link>
  );
}
