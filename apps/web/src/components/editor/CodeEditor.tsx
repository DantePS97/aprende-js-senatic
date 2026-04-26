'use client';

import { useCallback, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { Compartment } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { githubLight } from '@uiw/codemirror-theme-github';
import { material } from '@uiw/codemirror-theme-material';
import { usePreferencesStore } from '@/store/preferencesStore';
import type { UserPreferences } from '@senatic/shared';

// ─── Editor theme map ─────────────────────────────────────────────────────────

type EditorThemePref = UserPreferences['editorTheme'];

const EDITOR_THEME_MAP: Record<EditorThemePref, Extension> = {
  oneDark,
  dracula,
  githubLight,
  material,
};

// ─── Compartment — module scope to avoid recreation on render ─────────────────
// Note: assumes single CodeEditor instance per view. For multi-instance pages,
// move to useRef inside the component.

const themeCompartment = new Compartment();

// ─── Custom layout theme (fonts, spacing, focus — NO color overrides) ────────
// Colors (background, gutters, text) are intentionally left to the selected
// theme (oneDark / githubLight / …). Putting color here would override the
// active theme and make theme-switching appear broken.

const customTheme = EditorView.theme({
  '&': {
    borderRadius: '0.5rem',
    fontSize: '14px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  '.cm-content': {
    padding: '12px 0',
    minHeight: '200px',
  },
  '.cm-line': {
    padding: '0 12px 0 8px',
  },
  '.cm-focused': {
    outline: 'none',
  },
  // Accessible focus ring (accent-agnostic — uses a fixed indigo for now)
  '&.cm-focused': {
    boxShadow: '0 0 0 2px #6366F1',
  },
});

// ─── Props ────────────────────────────────────────────────────────────────────

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  language?: 'javascript' | 'html';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CodeEditor({ value, onChange, readOnly = false, language = 'javascript' }: CodeEditorProps) {
  const { preferences } = usePreferencesStore();
  const { editorTheme } = preferences;

  // Hold a reference to the EditorView for imperative Compartment.reconfigure calls
  const viewRef = useRef<EditorView | null>(null);

  const handleChange = useCallback(
    (val: string) => {
      if (!readOnly) onChange(val);
    },
    [onChange, readOnly],
  );

  // Capture EditorView on creation
  const handleCreateEditor = useCallback((view: EditorView) => {
    viewRef.current = view;
  }, []);

  // Live theme swap — fires on editorTheme preference change without unmounting
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const resolved = EDITOR_THEME_MAP[editorTheme] ?? oneDark;
    view.dispatch({
      effects: themeCompartment.reconfigure(resolved),
    });
  }, [editorTheme]);

  const langExtension = language === 'html' ? html() : javascript({ jsx: false });
  const fileLabel = language === 'html' ? 'index.html' : 'script.js';
  const initialTheme = EDITOR_THEME_MAP[editorTheme] ?? oneDark;

  return (
    <div className="rounded-lg overflow-hidden border border-slate-700">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border-b border-slate-700">
        <span className="w-3 h-3 rounded-full bg-red-500 opacity-75" />
        <span className="w-3 h-3 rounded-full bg-yellow-500 opacity-75" />
        <span className="w-3 h-3 rounded-full bg-green-500 opacity-75" />
        <span className="ml-2 text-xs text-slate-500 font-mono">{fileLabel}</span>
      </div>

      <CodeMirror
        value={value}
        onChange={handleChange}
        onCreateEditor={handleCreateEditor}
        extensions={[langExtension, customTheme, themeCompartment.of(initialTheme)]}
        readOnly={readOnly}
        aria-label={language === 'html' ? 'Editor de código HTML' : 'Editor de código JavaScript'}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: false,
          drawSelection: true,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: false,
          crosshairCursor: false,
          highlightActiveLine: true,
          highlightSelectionMatches: false,
          closeBracketsKeymap: true,
          searchKeymap: false,
          tabSize: 2,
        }}
      />
    </div>
  );
}
