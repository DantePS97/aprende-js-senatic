import type { Difficulty } from '@senatic/shared';

const STYLES: Record<Difficulty, string> = {
  facil:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  medio:   'bg-amber-500/20 text-amber-400 border-amber-500/30',
  dificil: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const LABELS: Record<Difficulty, string> = {
  facil:   'Fácil',
  medio:   'Medio',
  dificil: 'Difícil',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STYLES[difficulty]}`}>
      {LABELS[difficulty]}
    </span>
  );
}
