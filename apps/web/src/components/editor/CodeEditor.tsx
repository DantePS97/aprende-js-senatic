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

// ─── Custom layout + frame theme ─────────────────────────────────────────────
// This extension is placed LAST in the extensions array so its background/gutter
// declarations always win over the active editor theme (oneDark, githubLight…).
//
// Background colours read from CSS custom properties defined in globals.css:
//   --editor-surface / --editor-border / --editor-gutter-fg
// Those variables flip between light and dark values when html.dark is toggled,
// so the editor frame always matches the app theme regardless of which syntax
// theme the user has selected. `var()` references in StyleModule CSS strings are
// evaluated dynamically by the browser — they update without any JS dispatch.

const customTheme = EditorView.theme({
  '&': {
    backgroundColor: 'var(--editor-surface)',
    borderRadius: '0.5rem',
    fontSize: '14px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  '.cm-content': {
    padding: '12px 0',
    minHeight: '200px',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--editor-surface)',
    borderRight: '1px solid var(--editor-border)',
    color: 'var(--editor-gutter-fg)',
  },
  '.cm-line': {
    padding: '0 12px 0 8px',
  },
  '.cm-focused': {
    outline: 'none',
  },
  // Accessible focus ring
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
        extensions={[langExtension, themeCompartment.of(initialTheme), customTheme]}
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
