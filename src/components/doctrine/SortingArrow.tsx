type SortingArrowProps = {
  /** The single sorting letter shown at large scale. */
  letter: string;
  /** Optional override of the small-caps label. */
  label?: string;
  className?: string;
};

/**
 * The Pan Am sorting symbol — an outlined right-pointing arrow with a single
 * letter (A/B/C) at the end. Used to mark section, category, or priority lane.
 */
export function SortingArrow({
  letter,
  label = "Sorting Symbol",
  className,
}: SortingArrowProps) {
  return (
    <span
      className={`inline-flex items-stretch border-2 border-[var(--color-ground)] ${
        className ?? ""
      }`}
    >
      <span className="flex items-center px-3 py-1.5 border-r-2 border-[var(--color-ground)] t-utility">
        {label} →
      </span>
      <span className="flex items-center px-3 py-1.5 t-h2 leading-none">
        {letter}
      </span>
    </span>
  );
}
