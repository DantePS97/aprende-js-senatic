'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Tag, X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const SUGGESTED_TAGS = ['variables', 'condicionales', 'bucles', 'funciones', 'arrays', 'ayuda', 'error', 'objetos'];

export default function NewForumPostPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; body?: string; general?: string }>({});

  const addTag = (tag: string) => {
    const clean = tag.trim().toLowerCase();
    if (clean && !tags.includes(clean) && tags.length < 5) {
      setTags((prev) => [...prev, clean]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (title.trim().length < 10) errs.title = 'El título debe tener al menos 10 caracteres.';
    if (body.trim().length < 20) errs.body = 'La descripción debe tener al menos 20 caracteres.';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const { data } = await api.post('/forum/posts', {
        title: title.trim(),
        body: body.trim(),
        tags,
      });
      router.push(`/forum/${data.data._id}`);
    } catch {
      setErrors({ general: 'Error al publicar. Intenta de nuevo.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Volver"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Nueva pregunta</h1>
          <p className="text-sm text-slate-400">Describe tu duda con el mayor detalle posible</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título */}
        <div className="card space-y-2">
          <label className="text-sm font-semibold text-white" htmlFor="title">
            Título <span className="text-red-400">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: ¿Cómo funciona el bucle for en JavaScript?"
            maxLength={120}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5
                       text-sm text-slate-200 placeholder-slate-600
                       focus:outline-none focus:border-primary-500/60 transition-colors"
          />
          <div className="flex justify-between items-center">
            {errors.title ? (
              <p className="text-xs text-red-400">{errors.title}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-slate-600">{title.length}/120</span>
          </div>
        </div>

        {/* Descripción */}
        <div className="card space-y-2">
          <label className="text-sm font-semibold text-white" htmlFor="body">
            Descripción <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-slate-500">
            Explica el problema, qué has intentado y qué error obtienes.
          </p>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Estoy intentando hacer un bucle for que imprima los números del 1 al 10, pero..."
            rows={6}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5
                       text-sm text-slate-200 placeholder-slate-600
                       focus:outline-none focus:border-primary-500/60 resize-none transition-colors"
          />
          {errors.body && <p className="text-xs text-red-400">{errors.body}</p>}
        </div>

        {/* Tags */}
        <div className="card space-y-3">
          <div>
            <label className="text-sm font-semibold text-white" htmlFor="tags">
              Etiquetas
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Máximo 5 etiquetas. Presiona Enter o coma para agregar.
            </p>
          </div>

          {/* Tags seleccionados */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-primary-500/20
                             border border-primary-500/40 rounded-full text-primary-400"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-400 transition-colors ml-0.5"
                    aria-label={`Quitar etiqueta ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Input de tags */}
          {tags.length < 5 && (
            <input
              id="tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Escribe una etiqueta..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2
                         text-sm text-slate-200 placeholder-slate-600
                         focus:outline-none focus:border-primary-500/60 transition-colors"
            />
          )}

          {/* Sugerencias */}
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="text-xs px-2 py-1 border border-slate-700 rounded-full
                           text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Error general */}
        {errors.general && (
          <p className="text-sm text-red-400 text-center">{errors.general}</p>
        )}

        {/* Acciones */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white
                       text-sm font-semibold px-5 py-2 rounded-lg transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Publicar pregunta
          </button>
        </div>
      </form>
    </div>
  );
}
