import { CheckCircle } from 'lucide-react';

export function SolvedBadge({ solved }: { solved: boolean }) {
  if (!solved) return null;
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
      <CheckCircle className="w-3.5 h-3.5" />
      Resuelto
    </span>
  );
}
