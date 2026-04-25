import type { Tier } from '@senatic/shared';

// ─── Config ───────────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<Tier, { emoji: string; label: string; colorClass: string; bgClass: string }> = {
  gold:   { emoji: '🥇', label: 'Oro',   colorClass: 'text-yellow-400', bgClass: 'bg-yellow-400/10 border-yellow-400/30' },
  silver: { emoji: '🥈', label: 'Plata', colorClass: 'text-slate-300',  bgClass: 'bg-slate-300/10  border-slate-300/30'  },
  bronze: { emoji: '🥉', label: 'Bronce', colorClass: 'text-amber-600', bgClass: 'bg-amber-600/10  border-amber-600/30'  },
};

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', { wrapper: string; emoji: string; label: string }> = {
  sm: { wrapper: 'gap-1    px-2   py-0.5 text-xs', emoji: 'text-sm',  label: 'text-xs'  },
  md: { wrapper: 'gap-1.5  px-3   py-1   text-sm', emoji: 'text-base', label: 'text-sm' },
  lg: { wrapper: 'gap-2    px-4   py-1.5 text-base', emoji: 'text-xl', label: 'text-base' },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface TierBadgeProps {
  tier: Tier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TierBadge({ tier, size = 'md', showLabel = true }: TierBadgeProps) {
  const { emoji, label, colorClass, bgClass } = TIER_CONFIG[tier];
  const { wrapper, emoji: emojiSize, label: labelSize } = SIZE_CLASSES[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold
                  ${wrapper} ${bgClass} ${colorClass}`}
      aria-label={`Liga ${label}`}
    >
      <span className={emojiSize}>{emoji}</span>
      {showLabel && <span className={labelSize}>{label}</span>}
    </span>
  );
}
