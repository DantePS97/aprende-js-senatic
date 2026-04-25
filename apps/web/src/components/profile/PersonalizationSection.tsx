'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { usePreferencesStore } from '@/store/preferencesStore';
import { updatePreferences } from '@/services/preferencesService';
import type { UserPreferences } from '@senatic/shared';

// ─── Config ───────────────────────────────────────────────────────────────────

const THEME_OPTIONS: { value: UserPreferences['theme']; label: string }[] = [
  { value: 'dark',   label: 'Oscuro'     },
  { value: 'light',  label: 'Claro'      },
  { value: 'system', label: 'Automático' },
];

const ACCENT_OPTIONS: { value: UserPreferences['accentColor']; label: string; hex: string }[] = [
  { value: 'indigo',  label: 'Índigo',    hex: '#6366F1' },
  { value: 'emerald', label: 'Esmeralda', hex: '#10B981' },
  { value: 'rose',    label: 'Rosa',      hex: '#F43F5E' },
  { value: 'amber',   label: 'Ámbar',     hex: '#F59E0B' },
  { value: 'violet',  label: 'Violeta',   hex: '#8B5CF6' },
];

const FONT_SIZE_OPTIONS: { value: UserPreferences['fontSize']; label: string; preview: string }[] = [
  { value: 'normal', label: 'Normal', preview: 'Aa' },
  { value: 'large',  label: 'Grande', preview: 'Aa' },
];

const EDITOR_THEME_OPTIONS: { value: UserPreferences['editorTheme']; label: string }[] = [
  { value: 'oneDark',     label: 'One Dark'     },
  { value: 'dracula',     label: 'Drácula'      },
  { value: 'githubLight', label: 'GitHub Claro' },
  { value: 'material',    label: 'Material'     },
];

// ─── Helper: pill button ──────────────────────────────────────────────────────

function PillButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${active
          ? 'bg-primary-500 text-white'
          : 'bg-surface-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
        }
      `}
    >
      {children}
    </button>
  );
}

// ─── PersonalizationSection ───────────────────────────────────────────────────

export function PersonalizationSection() {
  const { preferences, isSaving, saveError } = usePreferencesStore();

  // "Guardado ✓" flash — triggers when saving transitions true→false without error
  const [saved, setSaved] = useState(false);
  const prevSavingRef = useRef(false);

  useEffect(() => {
    if (prevSavingRef.current && !isSaving && !saveError) {
      setSaved(true);
      const t = setTimeout(() => setSaved(false), 2000);
      return () => clearTimeout(t);
    }
    prevSavingRef.current = isSaving;
  }, [isSaving, saveError]);

  const handleChange = (partial: Partial<UserPreferences>) => {
    updatePreferences(partial).catch(() => {
      // Error already stored in preferencesStore.saveError — UI reads from there
    });
  };

  return (
    <section className="space-y-5">
      <h2 className="text-lg font-semibold text-white">Personalización</h2>

      {/* ── Tema ── */}
      <div className="card space-y-3">
        <p className="text-sm font-medium text-slate-300">Tema</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Tema de la aplicación">
          {THEME_OPTIONS.map((opt) => (
            <PillButton
              key={opt.value}
              active={preferences.theme === opt.value}
              disabled={isSaving}
              onClick={() => handleChange({ theme: opt.value })}
            >
              {opt.label}
            </PillButton>
          ))}
        </div>
      </div>

      {/* ── Color de acento ── */}
      <div className="card space-y-3">
        <p className="text-sm font-medium text-slate-300">Color de acento</p>
        <div className="flex gap-3" role="group" aria-label="Color de acento">
          {ACCENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-label={opt.label}
              disabled={isSaving}
              onClick={() => handleChange({ accentColor: opt.value })}
              className={`
                w-8 h-8 rounded-full transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                ${preferences.accentColor === opt.value
                  ? 'ring-2 ring-offset-2 ring-offset-surface-800'
                  : 'hover:scale-110'
                }
              `}
              style={{
                backgroundColor: opt.hex,
                ...(preferences.accentColor === opt.value
                  ? { boxShadow: `0 0 0 2px ${opt.hex}` }
                  : {}),
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Tamaño de texto ── */}
      <div className="card space-y-3">
        <p className="text-sm font-medium text-slate-300">Tamaño de texto</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Tamaño de texto">
          {FONT_SIZE_OPTIONS.map((opt) => (
            <PillButton
              key={opt.value}
              active={preferences.fontSize === opt.value}
              disabled={isSaving}
              onClick={() => handleChange({ fontSize: opt.value })}
            >
              <span
                className="mr-1.5 font-mono"
                style={{ fontSize: opt.value === 'large' ? '1.1em' : '0.9em' }}
              >
                {opt.preview}
              </span>
              {opt.label}
            </PillButton>
          ))}
        </div>
      </div>

      {/* ── Tema del editor ── */}
      <div className="card space-y-3">
        <p className="text-sm font-medium text-slate-300">Tema del editor</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Tema del editor de código">
          {EDITOR_THEME_OPTIONS.map((opt) => (
            <PillButton
              key={opt.value}
              active={preferences.editorTheme === opt.value}
              disabled={isSaving}
              onClick={() => handleChange({ editorTheme: opt.value })}
            >
              {opt.label}
            </PillButton>
          ))}
        </div>
      </div>

      {/* ── Save feedback ── */}
      <div className="h-5 flex items-center">
        {isSaving && (
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Loader2 className="w-3 h-3 animate-spin" />
            Guardando...
          </span>
        )}
        {!isSaving && saved && (
          <span className="flex items-center gap-1 text-xs text-success-DEFAULT">
            <Check className="w-3 h-3" />
            Guardado
          </span>
        )}
        {!isSaving && saveError && (
          <span className="text-xs text-red-400">
            Error al guardar. Se restauraron tus preferencias.
          </span>
        )}
      </div>
    </section>
  );
}
