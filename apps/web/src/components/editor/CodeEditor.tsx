'use client';

import { useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  language?: 'javascript' | 'html';
}

// Extensión para personalizar el fondo del editor
const customTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0F172A',
    borderRadius: '0.5rem',
    fontSize: '14px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  '.cm-content': {
    padding: '12px 0',
    minHeight: '200px',
  },
  '.cm-gutters': {
    backgroundColor: '#0F172A',
    borderRight: '1px solid #1E293B',
    color: '#475569',
  },
  '.cm-line': {
    padding: '0 12px 0 8px',
  },
  '.cm-focused': {
    outline: 'none',
  },
  // Borde de foco accesible
  '&.cm-focused': {
    boxShadow: '0 0 0 2px #6366F1',
  },
});

export function CodeEditor({ value, onChange, readOnly = false, language = 'javascript' }: CodeEditorProps) {
  const handleChange = useCallback(
    (val: string) => {
      if (!readOnly) onChange(val);
    },
    [onChange, readOnly]
  );

  const langExtension = language === 'html' ? html() : javascript({ jsx: false });
  const fileLabel = language === 'html' ? 'index.html' : 'script.js';

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
        extensions={[langExtension, customTheme]}
        theme={oneDark}
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
