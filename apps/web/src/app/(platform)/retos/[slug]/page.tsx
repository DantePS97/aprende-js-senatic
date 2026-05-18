'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { challengesService } from '@/services/challengesService';
import { ChallengeRunner } from '@/components/challenges/ChallengeRunner';
import type { Challenge, ChallengeProgress } from '@senatic/shared';

export default function ChallengeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    challengesService
      .get(slug)
      .then(({ challenge: c, progress: p }) => {
        setChallenge(c);
        setProgress(p);
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 403) {
          router.replace('/retos/bloqueado');
        } else if (status === 404) {
          setError('Reto no encontrado.');
        } else {
          setError('Error al cargar el reto. Intenta de nuevo.');
        }
      })
      .finally(() => setLoading(false));
  }, [slug, router]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-1/3" />
        <div className="h-4 bg-slate-700 rounded w-1/2" />
        <div className="card h-40" />
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 mb-4">{error ?? 'Reto no encontrado.'}</p>
        <Link href="/retos" className="text-primary-400 hover:underline">
          Volver a Retos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <Link href="/retos" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver a Retos
        </Link>
      </div>
      <ChallengeRunner challenge={challenge} initialProgress={progress} />
    </div>
  );
}
