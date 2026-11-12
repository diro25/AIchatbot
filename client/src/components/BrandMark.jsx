export function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className="brand-orbit" aria-hidden="true"><span /></span>
      {!compact && (
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-slate-700 dark:text-slate-200">
          Signal Room
        </span>
      )}
    </div>
  );
}
