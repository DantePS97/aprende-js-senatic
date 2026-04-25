import type { UserPreferences } from '@senatic/shared';

type Theme = UserPreferences['theme'];
type AccentColor = UserPreferences['accentColor'];
type FontSize = UserPreferences['fontSize'];

// ─── Accent color map ─────────────────────────────────────────────────────────
// RGB triplets (space-separated, no rgb() wrapper).
// Tailwind consumes via: rgb(var(--color-primary-500) / <alpha-value>)

const ACCENT_MAP: Record<AccentColor, { 400: string; 500: string; 600: string }> = {
  indigo:  { 400: '129 140 248', 500: '99 102 241',  600: '79 70 229'  },
  emerald: { 400: '52 211 153',  500: '16 185 129',   600: '5 150 105'  },
  rose:    { 400: '251 113 133', 500: '244 63 94',    600: '225 29 72'  },
  amber:   { 400: '251 191 36',  500: '245 158 11',   600: '217 119 6'  },
  violet:  { 400: '167 139 250', 500: '139 92 246',   600: '124 58 237' },
};

// ─── matchMedia listener — stored at module scope to avoid stacking ───────────

let _mq: MediaQueryList | null = null;
let _mqListener: ((e: MediaQueryListEvent) => void) | null = null;

// ─── applyTheme ───────────────────────────────────────────────────────────────

export function applyTheme(theme: Theme): void {
  const html = document.documentElement;

  // Always clean up previous system listener before switching
  if (_mq && _mqListener) {
    _mq.removeEventListener('change', _mqListener);
    _mq = null;
    _mqListener = null;
  }

  if (theme === 'dark') {
    html.classList.add('dark');
  } else if (theme === 'light') {
    html.classList.remove('dark');
  } else {
    // 'system' — sync with OS preference + react to changes in real-time
    _mq = window.matchMedia('(prefers-color-scheme: dark)');

    const sync = (matches: boolean) => {
      if (matches) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
    };

    sync(_mq.matches);

    _mqListener = (e) => sync(e.matches);
    _mq.addEventListener('change', _mqListener);
  }
}

// ─── applyAccent ──────────────────────────────────────────────────────────────

export function applyAccent(accent: AccentColor): void {
  const shades = ACCENT_MAP[accent] ?? ACCENT_MAP.indigo;
  const html = document.documentElement;
  html.style.setProperty('--color-primary-400', shades[400]);
  html.style.setProperty('--color-primary-500', shades[500]);
  html.style.setProperty('--color-primary-600', shades[600]);
}

// ─── applyFontSize ────────────────────────────────────────────────────────────
// Sets html font-size directly; all rem-based values scale automatically.

export function applyFontSize(size: FontSize): void {
  document.documentElement.style.fontSize = size === 'large' ? '18px' : '16px';
}

// ─── applyPreferences ─────────────────────────────────────────────────────────
// Only applies keys present in the partial — safe to call with single-key updates.

export function applyPreferences(prefs: Partial<UserPreferences>): void {
  if (prefs.theme !== undefined) applyTheme(prefs.theme);
  if (prefs.accentColor !== undefined) applyAccent(prefs.accentColor);
  if (prefs.fontSize !== undefined) applyFontSize(prefs.fontSize);
  // editorTheme is handled by CodeEditor via Compartment.reconfigure — not a DOM concern
}
