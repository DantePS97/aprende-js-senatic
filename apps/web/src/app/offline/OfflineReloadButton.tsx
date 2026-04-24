'use client';

export default function OfflineReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
    >
      Intentar de nuevo
    </button>
  );
}
