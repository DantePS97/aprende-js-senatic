'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// XSS-safe: react-markdown sanitizes by default; rehype-raw not enabled
import { Loader2, Plus, Trash2, RefreshCw } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';
import { ExerciseFieldset } from '@/components/admin/ExerciseFieldset';
import { CodeTextarea } from '@/components/admin/CodeTextarea';
import { UnsavedChangesGuard } from '@/components/admin/UnsavedChangesGuard';
import { useToastStore } from '@/store/toastStore';
import type { ExerciseData } from '@/components/admin/ExerciseFieldset';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExampleData {
  code: string;
  explanation: string;
}

interface ContentState {
  theoryMarkdown: string;
  examples: ExampleData[];
  exercises: ExerciseData[];
}

// ─── Example fieldset ─────────────────────────────────────────────────────────

function ExampleFieldset({
  index,
  data,
  onChange,
  onRemove,
}: {
  index: number;
  data: ExampleData;
  onChange: (i: number, d: ExampleData) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <fieldset className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <legend className="text-sm font-semibold text-gray-700">Ejemplo {index + 1}</legend>
        <button
          type="button"
          onClick={() => onRemove(index)}
          aria-label={`Eliminar ejemplo ${index + 1}`}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">Código</label>
        <CodeTextarea
          value={data.code}
          onChange={(code) => onChange(index, { ...data, code })}
          rows={3}
          placeholder="// Código del ejemplo"
          language="javascript"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600">Explicación</label>
        <textarea
          value={data.explanation}
          onChange={(e) => onChange(index, { ...data, explanation: e.target.value })}
          rows={2}
          placeholder="Explica qué hace el código anterior..."
          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm resize-y
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
    </fieldset>
  );
}

// ─── Markdown preview ─────────────────────────────────────────────────────────

function MarkdownPreview({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-sm max-w-none text-gray-800 space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-gray-900 mt-4 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-gray-800 mt-4 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-800 mt-3 mb-1">{children}</h3>
          ),
          p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-2">{children}</p>,
          code: ({ className, children }) => {
            const isBlock = Boolean(className);
            if (isBlock) {
              return (
                <code className="block text-xs font-mono text-gray-800">{children}</code>
              );
            }
            return (
              <code className="text-primary-700 bg-primary-50 rounded px-1 py-0.5 text-xs font-mono">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gray-100 border border-gray-200 rounded-lg p-3 my-3 overflow-x-auto text-xs leading-relaxed">
              {children}
            </pre>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 mb-2 pl-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 mb-2 pl-2">
              {children}
            </ol>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary-400 bg-primary-50 px-4 py-2 rounded-r-lg my-3 text-sm text-gray-700">
              {children}
            </blockquote>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const DEFAULT_EXERCISE: ExerciseData = {
  title: '',
  prompt: '',
  startCode: '// Escribe tu código aquí\n',
  tests: '[\n  { "description": "", "expression": "" }\n]',
  hints: [],
};

export default function LessonContentPage() {
  const { id: courseId, moduleId, lessonId } = useParams<{
    id: string;
    moduleId: string;
    lessonId: string;
  }>();
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);

  const [content, setContent] = useState<ContentState>({
    theoryMarkdown: '',
    examples: [],
    exercises: [{ ...DEFAULT_EXERCISE }],
  });
  const [previewMarkdown, setPreviewMarkdown] = useState('');
  const [serverUpdatedAt, setServerUpdatedAt] = useState('');
  const [stale, setStale] = useState(false);

  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Fetch helpers ────────────────────────────────────────────────────────────

  type RawContent = {
    theory?: { markdown?: string; examples?: ExampleData[] };
    exercises?: Array<{
      title?: string;
      prompt?: string;
      startCode?: string;
      tests?: string;
      hints?: string[];
    }>;
    updatedAt?: string;
  };

  const applyContent = useCallback((c: RawContent) => {
    const exercises: ExerciseData[] = (c.exercises ?? []).map((ex) => ({
      title: ex.title ?? '',
      prompt: ex.prompt ?? '',
      startCode: ex.startCode ?? '',
      tests: typeof ex.tests === 'string'
        ? ex.tests
        : JSON.stringify(ex.tests ?? [], null, 2),
      hints: ex.hints ?? [],
    }));

    const loaded: ContentState = {
      theoryMarkdown: c.theory?.markdown ?? '',
      examples: c.theory?.examples ?? [],
      exercises: exercises.length > 0 ? exercises : [{ ...DEFAULT_EXERCISE }],
    };

    setContent(loaded);
    setPreviewMarkdown(loaded.theoryMarkdown);
    if (c.updatedAt) setServerUpdatedAt(c.updatedAt);
    setDirty(false);
  }, []);

  const reloadContent = useCallback(() => {
    setLoading(true);
    setStale(false);
    adminApi.lessons.content.get(lessonId)
      .then((data) => applyContent(data as RawContent))
      .catch(() => {
        // Content may not exist yet — that's OK
      })
      .finally(() => setLoading(false));
  }, [lessonId, applyContent]);

  // Fetch existing content on mount
  useEffect(() => { reloadContent(); }, [reloadContent]);

  // Debounced markdown preview
  const handleMarkdownChange = (value: string) => {
    setContent((prev) => ({ ...prev, theoryMarkdown: value }));
    setDirty(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPreviewMarkdown(value), 300);
  };

  const handleExampleChange = (i: number, updated: ExampleData) => {
    setContent((prev) => {
      const examples = [...prev.examples];
      examples[i] = updated;
      return { ...prev, examples };
    });
    setDirty(true);
  };

  const handleExampleRemove = (i: number) => {
    setContent((prev) => ({
      ...prev,
      examples: prev.examples.filter((_, idx) => idx !== i),
    }));
    setDirty(true);
  };

  const handleExerciseChange = (i: number, updated: ExerciseData) => {
    setContent((prev) => {
      const exercises = [...prev.exercises];
      exercises[i] = updated;
      return { ...prev, exercises };
    });
    setDirty(true);
  };

  const handleExerciseRemove = (i: number) => {
    setContent((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, idx) => idx !== i),
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);

    // tests is stored and sent as a string (server expects z.string())
    const exercises = content.exercises.map((ex) => ({
      title: ex.title,
      prompt: ex.prompt,
      startCode: ex.startCode,
      tests: ex.tests,
      hints: ex.hints,
    }));

    const payload = {
      theory: {
        markdown: content.theoryMarkdown,
        examples: content.examples,
      },
      exercises,
      // Send current serverUpdatedAt so backend can detect concurrent edits
      updatedAt: serverUpdatedAt || undefined,
    };

    try {
      const saved = (await adminApi.lessons.content.update(lessonId, payload)) as { updatedAt?: string };
      addToast('success', 'Contenido guardado ✓');
      setStale(false);
      setDirty(false);
      // Use the PUT response directly — no extra GET needed
      if (saved?.updatedAt) setServerUpdatedAt(saved.updatedAt);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'STALE_ENTITY') {
        addToast('warning', 'El contenido fue modificado por otro admin. Recarga para ver los cambios.');
        setStale(true);
      } else {
        addToast('error', 'Error inesperado. Intenta de nuevo.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full">
      <UnsavedChangesGuard dirty={dirty} />
      <AdminBreadcrumbs
        items={[
          { label: 'Cursos', href: '/admin/courses' },
          { label: 'Curso', href: `/admin/courses/${courseId}` },
          { label: 'Módulo', href: `/admin/courses/${courseId}/modules/${moduleId}` },
          {
            label: 'Lección',
            href: `/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
          },
          { label: 'Contenido' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Editor de Contenido</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`
              )
            }
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300
                       rounded-lg hover:bg-gray-50 transition-colors"
          >
            Volver
          </button>
          {stale && (
            <button
              type="button"
              onClick={reloadContent}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700
                         bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600
                       rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Split pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[600px]">
        {/* LEFT: Form */}
        <div className="space-y-6 overflow-y-auto max-h-[80vh] pr-1">
          {/* Theory section */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-gray-800">Teoría (Markdown)</h2>
            <CodeTextarea
              value={content.theoryMarkdown}
              onChange={handleMarkdownChange}
              rows={14}
              placeholder="# Título de la lección&#10;&#10;Escribe la teoría en Markdown..."
              language="markdown"
            />
          </section>

          {/* Examples section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">
                Ejemplos ({content.examples.length}/20)
              </h2>
              {content.examples.length < 20 && (
                <button
                  type="button"
                  onClick={() =>
                    setContent((prev) => ({
                      ...prev,
                      examples: [...prev.examples, { code: '', explanation: '' }],
                    }))
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-700
                             bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar ejemplo
                </button>
              )}
            </div>

            {content.examples.length === 0 && (
              <p className="text-sm text-gray-400 italic">Sin ejemplos aún.</p>
            )}

            {content.examples.map((ex, i) => (
              <ExampleFieldset
                key={i}
                index={i}
                data={ex}
                onChange={handleExampleChange}
                onRemove={handleExampleRemove}
              />
            ))}
          </section>

          {/* Exercises section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">
                Ejercicios ({content.exercises.length}/30)
              </h2>
              {content.exercises.length < 30 && (
                <button
                  type="button"
                  onClick={() =>
                    setContent((prev) => ({
                      ...prev,
                      exercises: [...prev.exercises, { ...DEFAULT_EXERCISE }],
                    }))
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-700
                             bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar ejercicio
                </button>
              )}
            </div>

            {content.exercises.map((ex, i) => (
              <ExerciseFieldset
                key={i}
                index={i}
                data={ex}
                onChange={handleExerciseChange}
                onRemove={handleExerciseRemove}
                canRemove={content.exercises.length > 1}
              />
            ))}
          </section>
        </div>

        {/* RIGHT: Live preview */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 overflow-y-auto max-h-[80vh] sticky top-0">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-gray-500">Vista previa en vivo</span>
          </div>

          {previewMarkdown ? (
            <MarkdownPreview markdown={previewMarkdown} />
          ) : (
            <p className="text-sm text-gray-400 italic">
              Escribe contenido en Markdown para ver la vista previa aquí.
            </p>
          )}
        </div>
      </div>

      {/* Hidden updatedAt — kept in state for optimistic locking */}
      <input type="hidden" value={serverUpdatedAt} readOnly />
    </div>
  );
}
