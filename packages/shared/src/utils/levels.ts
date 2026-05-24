// ─── XP → Level mapping (single source of truth) ─────────────────────────────
//
// Consumed by:
//   - apps/api   → gamification.service.ts  (calculateLevel)
//   - apps/web   → XPBar.tsx, profile/page.tsx, admin pages
//
// Rules: never change minXp of existing levels without a data migration;
// only add new levels at the end.

export const LEVEL_THRESHOLDS = [
  { level: 1,  minXp: 0,    title: 'Aprendiz'     },
  { level: 2,  minXp: 101,  title: 'Explorador'   },
  { level: 3,  minXp: 301,  title: 'Programador'  },
  { level: 4,  minXp: 601,  title: 'Desarrollador'},
  { level: 5,  minXp: 1001, title: 'Experto'      },
  { level: 6,  minXp: 1500, title: 'Senior'       },
  { level: 7,  minXp: 2500, title: 'Líder'        },
  { level: 8,  minXp: 4000, title: 'Arquitecto'   },
  { level: 9,  minXp: 6000, title: 'Maestro'      },
  { level: 10, minXp: 9000, title: 'Leyenda'      },
] as const;

export type LevelThreshold = (typeof LEVEL_THRESHOLDS)[number];

/** Highest level a user can reach. */
export const MAX_LEVEL = 10 as const;

/**
 * minXp values as a flat array — index 0 = level 1, index 1 = level 2, …
 * Useful for range calculations (e.g. XPBar progress percentage).
 */
export const LEVEL_MIN_XP: readonly number[] = LEVEL_THRESHOLDS.map((t) => t.minXp);

/**
 * Returns the display title for a given level number (1-based).
 * Falls back to the last level title for any value above MAX_LEVEL.
 */
export function getLevelTitle(level: number): string {
  return (
    LEVEL_THRESHOLDS.find((t) => t.level === level)?.title ??
    LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].title
  );
}
