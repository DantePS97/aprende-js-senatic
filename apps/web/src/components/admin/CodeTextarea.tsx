'use client';

import { useCallback, useRef } from 'react';

interface CodeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  /** Reserved for future CodeMirror swap — not used in v1 */
  language?: string;
}

/**
 * Monospace textarea with synchronized line numbers.
 * Drop-in replacement for plain <textarea> in code-editing contexts.
 */
export function CodeTextarea({
  value,
  onChange,
  rows = 10,
  placeholder,
  language: _,
}: CodeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const numbersRef = useRef<HTMLDivElement>(null);

  const syncScroll = useCallback(() => {
    if (textareaRef.current && numbersRef.current) {
      numbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  const lineCount = value.split('\n').length;

  return (
    <div
      className="flex border border-gray-300 rounded-lg overflow-hidden
                 font-mono text-sm focus-within:ring-2 focus-within:ring-primary-500
                 focus-within:border-transparent"
    >
      {/* Line numbers */}
      <div
        ref={numbersRef}
        aria-hidden
        className="select-none overflow-hidden bg-gray-100 text-gray-400
                   text-right px-2 py-2 leading-relaxed"
        style={{ minWidth: '2.5rem' }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>

      {/* Editable area */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        rows={rows}
        placeholder={placeholder}
        spellCheck={false}
        className="flex-1 px-3 py-2 bg-white resize-y outline-none leading-relaxed"
      />
    </div>
  );
}
