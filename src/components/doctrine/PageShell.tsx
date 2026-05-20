import { type ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  width?: "default" | "narrow";
  className?: string;
};

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function PageShell({
  children,
  width = "default",
  className,
}: PageShellProps) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-4 sm:gap-5",
        width === "narrow" && "max-w-[720px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
