import type { Metadata } from 'next';
import OfflineReloadButton from './OfflineReloadButton';

export const metadata: Metadata = {
  title: 'Sin conexión',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center px-6 text-center">
      <div className="text-6xl mb-6">📡</div>
      <h1 className="text-2xl font-bold text-white mb-3">Sin conexión a internet</h1>
      <p className="text-slate-400 max-w-sm mb-8">
        Parece que no tienes internet en este momento. Las lecciones que ya visitaste siguen disponibles.
      </p>
      <OfflineReloadButton />
    </div>
  );
}
