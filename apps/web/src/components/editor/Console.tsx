'use client';

interface ConsoleLine {
  text: string;
  type?: 'output' | 'error';
}

interface ConsoleProps {
  lines: ConsoleLine[];
  error?: string | null;
  isEmpty?: boolean;
}

export function Console({ lines, error, isEmpty }: ConsoleProps) {
  const hasContent = lines.length > 0 || error;

  return (
    <div className="rounded-lg overflow-hidden border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success-DEFAULT" />
          <span className="text-xs text-slate-400 font-mono">Consola</span>
        </div>
        {hasContent && (
          <span className="text-xs text-slate-600">
            {lines.length} línea{lines.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Output */}
      <div className="bg-surface-900 font-mono text-sm p-3 min-h-[100px] max-h-[200px] overflow-y-auto">
        {isEmpty && !hasContent && (
          <p className="text-slate-600 italic text-xs">
            Ejecuta tu código para ver el resultado aquí...
          </p>
        )}

        {lines.map((line, i) => (
          <div
            key={i}
            className={`py-0.5 ${line.type === 'error' ? 'text-red-400' : 'text-slate-300'}`}
          >
            <span className="text-slate-600 select-none mr-2">{'>'}</span>
            <span className="whitespace-pre-wrap break-all">{line.text}</span>
          </div>
        ))}

        {error && (
          <div className="mt-1 py-1 px-2 bg-red-950 border border-red-800 rounded text-red-400 text-xs">
            <span className="font-bold">Error: </span>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
