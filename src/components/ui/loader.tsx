type LoaderSize = "xs" | "sm" | "md" | "lg";

/**
 * The product's one pending mark. Decorative by design — it is always
 * shipped alongside text (a button's "Saving…", a panel's status line) or
 * inside a labelled region, so screen readers get the wait from the copy
 * rather than from a spinning glyph.
 *
 * Colour is inherited, so the same element reads white on a primary button
 * and green on an outline button without a variant. Standalone, pass
 * `loader-brand` for the logo's green ring with a gold arc.
 */
export function Loader({
  size = "sm",
  className = "",
}: {
  size?: LoaderSize;
  className?: string;
}) {
  return <span aria-hidden="true" className={`loader loader-${size} ${className}`} />;
}

/**
 * Centred wait for a whole panel or a route fallback, where there is no
 * control to attach the mark to.
 */
export function LoadingPanel({
  label,
  size = "md",
  className = "",
}: {
  label: string;
  size?: LoaderSize;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center gap-4 py-16 text-center ${className}`}
    >
      <Loader size={size} className="loader-brand" />
      <p className="text-[0.8125rem] font-medium text-muted">{label}</p>
    </div>
  );
}
