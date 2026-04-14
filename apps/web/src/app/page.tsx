import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-surface-900 flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mb-6 text-6xl">💻</div>

        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Aprende{' '}
          <span className="text-primary-500">JavaScript</span>
        </h1>

        <p className="text-xl text-slate-400 max-w-lg mb-8">
          Lecciones interactivas, práctica real y gamificación para estudiantes.
          Funciona incluso{' '}
          <span className="text-success-DEFAULT font-semibold">sin internet</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="btn-primary text-lg px-8 py-4"
          >
            Comenzar gratis
          </Link>
          <Link
            href="/login"
            className="border border-slate-600 text-slate-300 hover:border-primary-500 hover:text-primary-400
                       font-semibold py-4 px-8 rounded-lg transition-colors duration-200 text-lg"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
        {[
          { emoji: '🎮', title: 'Gamificación', desc: 'Gana XP, sube de nivel y desbloquea logros mientras aprendes' },
          { emoji: '⚡', title: 'Práctica real', desc: 'Editor de código en el navegador con tests automáticos y feedback inmediato' },
          { emoji: '📱', title: 'Sin internet', desc: 'Descarga el contenido y aprende desde cualquier lugar, sin datos móviles' },
        ].map((f) => (
          <div key={f.title} className="card text-center">
            <div className="text-3xl mb-3">{f.emoji}</div>
            <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-slate-400 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-slate-600 text-sm">
        SENATIC — Plataforma educativa de programación
      </footer>
    </main>
  );
}
