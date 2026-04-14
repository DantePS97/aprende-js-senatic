'use client';

import { useState } from 'react';
import { Lightbulb, ChevronDown } from 'lucide-react';

interface HintSystemProps {
  hints: string[];
  onHintUsed: (count: number) => void;
}

export function HintSystem({ hints, onHintUsed }: HintSystemProps) {
  const [revealed, setRevealed] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const revealNext = () => {
    if (revealed < hints.length) {
      const newCount = revealed + 1;
      setRevealed(newCount);
      onHintUsed(newCount);
      setIsOpen(true);
    }
  };

  const xpPenalty = revealed === 0 ? 0 : revealed === 1 ? -5 : -10;

  return (
    <div className="card">
      {/* Header */}
      <button
        className="flex items-center justify-between w-full text-left"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-xp-DEFAULT" />
          <span className="text-sm font-semibold text-slate-300">
            Pistas
            {revealed > 0 && (
              <span className="ml-2 text-xs text-xp-DEFAULT">
                ({revealed}/{hints.length} usadas)
              </span>
            )}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="mt-3 space-y-2">
          {/* Aviso de penalización */}
          {revealed === 0 && (
            <p className="text-xs text-slate-500 italic">
              Usar pistas reduce el XP ganado. ¡Intenta resolverlo solo primero!
            </p>
          )}

          {/* Pistas reveladas */}
          {hints.slice(0, revealed).map((hint, i) => (
            <div
              key={i}
              className="flex gap-2 p-2.5 bg-xp-DEFAULT/10 border border-xp-DEFAULT/20 rounded-lg animate-fade-up"
            >
              <span className="text-xp-DEFAULT font-bold text-xs mt-0.5 shrink-0">
                {i + 1}.
              </span>
              <p className="text-sm text-slate-300">{hint}</p>
            </div>
          ))}

          {/* Botón para revelar */}
          {revealed < hints.length && (
            <button
              onClick={revealNext}
              className="w-full py-2 px-3 text-sm border border-xp-DEFAULT/30 text-xp-DEFAULT
                         hover:bg-xp-DEFAULT/10 rounded-lg transition-colors duration-200 flex items-center
                         justify-center gap-1.5"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Ver pista {revealed + 1}
              {xpPenalty < 0 && (
                <span className="text-xs text-slate-500 ml-1">({xpPenalty} XP)</span>
              )}
            </button>
          )}

          {revealed === hints.length && (
            <p className="text-xs text-slate-600 text-center">
              Has usado todas las pistas disponibles
            </p>
          )}
        </div>
      )}
    </div>
  );
}
