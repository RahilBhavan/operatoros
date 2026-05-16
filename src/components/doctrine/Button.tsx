import Link from "next/link";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "ground" | "mark" | "ghost";

type Common = {
  variant?: Variant;
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
  }[v];
}

type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "ground",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={clsx(variantClass(variant), className)} {...rest}>
      {children}
    </button>
  );
}

type LinkButtonProps = Common & {
  href: string;
  prefetch?: boolean;
};

export function LinkButton({
  variant = "ground",
  className,
  children,
  href,
  prefetch,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={clsx(variantClass(variant), className)}
    >
      {children}
    </Link>
  );
}
