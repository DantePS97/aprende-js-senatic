'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { SkeletonList } from '@/components/admin/SkeletonRow';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { useToastStore } from '@/store/toastStore';
import { TestCaseList } from './TestCaseList';
import type { TestCase } from '@senatic/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

type Difficulty = 'facil' | 'medio' | 'dificil';

interface ChallengeDoc {
  _id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  xpReward: number;
  starterCode: string;
  tags: string[];
  testCases: TestCase[];
  published: boolean;
}

interface ChallengeFormProps {
  mode: 'create' | 'edit';
  challengeId?: string;
}

// ─── Slug helpers ─────────────────────────────────────────────────────────────

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const DEFAULT_STARTER = `function solution(input) {
  // Tu solución aquí
}`;

// ─── Component ────────────────────────────────────────────────────────────────

export function ChallengeForm({ mode, challengeId }: ChallengeFormProps) {
  const router = useRouter();
  const isEdit = mode === 'edit';
  const addToast = useToastStore((s) => s.addToast);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [existingSlug, setExistingSlug] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('facil');
  const [xpReward, setXpReward] = useState(30);
  const [starterCode, setStarterCode] = useState(DEFAULT_STARTER);
  const [tags, setTags] = useState('');
  const [testCases, setTestCases] = useState<TestCase[]>([{ input: '', expectedOutput: '', hidden: false }]);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (!isEdit || !challengeId) return;
    adminApi.challenges
      .get(challengeId)
      .then((data) => {
        const c = data as ChallengeDoc;
        setTitle(c.title);
        setExistingSlug(c.slug);
        setDescription(c.description);
        setDifficulty(c.difficulty);
        setXpReward(c.xpReward);
        setStarterCode(c.starterCode);
        setTags((c.tags ?? []).join(', '));
        setTestCases(c.testCases?.length ? c.testCases : [{ input: '', expectedOutput: '', hidden: false }]);
        setPublished(c.published);
      })
      .catch(() => setError('No se pudo cargar el reto.'))
      .finally(() => setLoading(false));
  }, [isEdit, challengeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (testCases.length === 0) {
      setError('Agrega al menos un caso de prueba.');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      title,
      description,
      difficulty,
      xpReward,
      starterCode,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      testCases,
      published,
    };

    try {
      if (isEdit && challengeId) {
        await adminApi.challenges.update(challengeId, payload);
      } else {
        await adminApi.challenges.create(payload);
      }
      addToast({ type: 'success', message: 'Reto guardado correctamente.' });
      router.push('/admin/challenges');
    } catch {
      setError('No se pudo guardar el reto. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonList rows={6} />;

  return (
    <div className="space-y-8">
      <AdminBreadcrumbs
        items={[
          { label: 'Retos', href: '/admin/challenges' },
          { label: isEdit ? title || 'Editar Reto' : 'Nuevo Reto' },
        ]}
      />

      <h1 className="text-2xl font-bold text-gray-900">
        {isEdit ? 'Editar Reto' : 'Nuevo Reto'}
      </h1>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Información general</h2>

          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              required
              minLength={3}
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Calcular propina de restaurante"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Slug {isEdit ? '(inmutable)' : '(generado automáticamente)'}
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-500">
              {isEdit ? existingSlug : (title ? toSlug(title) : '—')}
            </div>
          </div>

          {/* Difficulty + XP */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                Dificultad <span className="text-red-500">*</span>
              </label>
              <select
                id="difficulty"
                required
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="facil">Fácil</option>
                <option value="medio">Medio</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="xpReward" className="block text-sm font-medium text-gray-700">
                XP <span className="text-red-500">*</span>
              </label>
              <input
                id="xpReward"
                type="number"
                required
                min={1}
                max={500}
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Etiquetas (separadas por coma)
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ej: strings, arrays, matemáticas"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Published */}
          <div className="flex items-center gap-3">
            <input
              id="published"
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="published" className="text-sm font-medium text-gray-700">
              Publicar reto (visible para los estudiantes)
            </label>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Enunciado (Markdown)</h2>
          <textarea
            required
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el problema usando Markdown. Incluye contexto, ejemplos y restricciones."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono resize-y
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400">{description.length} caracteres</p>
        </div>

        {/* Starter Code */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Código inicial</h2>
          <p className="text-xs text-gray-500">
            La función debe llamarse <code className="bg-gray-100 px-1 rounded">solution</code> y recibir un argumento.
          </p>
          <CodeEditor value={starterCode} onChange={setStarterCode} language="javascript" />
        </div>

        {/* Test Cases */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <TestCaseList value={testCases} onChange={setTestCases} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/challenges')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
                       rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600
                       rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear Reto'}
          </button>
        </div>
      </form>
    </div>
  );
}
