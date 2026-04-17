// SkeletonRow — animated placeholder row for list loading states.
// Usage: render 3–5 of these while fetching data.

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
      <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
      <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
      <div className="w-20 h-5 bg-gray-200 rounded-full animate-pulse" />
      <div className="w-16 h-5 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}
