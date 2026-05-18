import { type ReactNode } from "react";
import { Wordmark } from "@/components/doctrine/Wordmark";

type PublicNavProps = {
  /** Right-side caption (e.g. "Accountant portal", "Shared view", "Invitation"). */
  caption?: ReactNode;
  /** Optional extra element rendered alongside the caption (e.g. an EXPIRES stamp). */
  rightExtra?: ReactNode;
};

/**
 * PublicNav — single source of truth for the token-portal / share-link page
 * chrome. Mirrors the post-pivot nav language: white surface, 4px Ink top
 * stripe, 1px hairline bottom. Server component.
 */
export function PublicNav({ caption, rightExtra }: PublicNavProps) {
  return (
    <nav
      aria-label="Public portal"
      className="w-full bg-[var(--color-field)] border-t-4 border-b border-t-[var(--color-ground)] border-b-[var(--color-ground)]"
    >
      <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-4 px-6 py-4 flex-wrap">
        <Wordmark size={20} />
        <div className="flex items-center gap-4 flex-wrap justify-end">
          {caption ? (
            <span className="t-utility text-[var(--color-ground)]">
              {caption}
            </span>
          ) : null}
          {rightExtra}
        </div>
      </div>
    </nav>
  );
}
