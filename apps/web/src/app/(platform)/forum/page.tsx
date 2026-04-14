'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, MessageSquare, ThumbsUp, Tag, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { ForumPost } from '@senatic/shared';

const POPULAR_TAGS = ['variables', 'condicionales', 'bucles', 'funciones', 'arrays', 'ayuda'];

export default function ForumPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = useCallback(async (tag: string | null, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (tag) params.append('tag', tag);
      const { data } = await api.get(`/forum/posts?${params}`);
      setPosts(data.data);
      setTotalPages(data.meta.pages);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(activeTag, page);
  }, [activeTag, page, fetchPosts]);

  const handleTagClick = (tag: string) => {
    setActiveTag((prev) => (prev === tag ? null : tag));
    setPage(1);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Comunidad</h1>
          <p className="text-sm text-slate-400 mt-0.5">Pregunta, responde y aprende con otros</p>
        </div>
        <button
          onClick={() => router.push('/forum/new')}
          className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white
                     text-sm font-semibold px-3 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nueva pregunta</span>
        </button>
      </div>

      {/* Filtros por tag */}
      <div className="flex gap-2 flex-wrap">
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
              activeTag === tag
                ? 'bg-primary-500/20 border-primary-500/40 text-primary-400'
                : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
            }`}
          >
            <Tag className="w-3 h-3" />
            {tag}
          </button>
        ))}
        {activeTag && (
          <button
            onClick={() => { setActiveTag(null); setPage(1); }}
            className="text-xs px-2.5 py-1.5 text-red-400 hover:text-red-300 transition-colors"
          >
            × Limpiar filtro
          </button>
        )}
      </div>

      {/* Lista de posts */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse h-24 bg-slate-800" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card text-center py-12 space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-700 mx-auto" />
          <p className="text-slate-500">
            {activeTag ? `No hay preguntas sobre "${activeTag}" aún.` : 'Sé el primero en hacer una pregunta.'}
          </p>
          <button
            onClick={() => router.push('/forum/new')}
            className="text-sm text-primary-400 hover:text-primary-300"
          >
            Crear la primera pregunta →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/forum/${post._id}`}
              className="card block hover:border-primary-500/40 transition-colors group"
            >
              <div className="flex items-start gap-3">
                {/* Avatar autor */}
                <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center
                                text-sm font-bold text-primary-400 shrink-0 mt-0.5">
                  {post.author?.displayName?.[0]?.toUpperCase() ?? '?'}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Título */}
                  <h3 className="font-semibold text-white group-hover:text-primary-400 transition-colors line-clamp-2 text-sm">
                    {post.title}
                  </h3>

                  {/* Preview del body */}
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{post.body}</p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-slate-600">{post.author?.displayName}</span>

                    {post.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-500"
                      >
                        {tag}
                      </span>
                    ))}

                    <div className="ml-auto flex items-center gap-3 text-slate-600 text-xs">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> {post.upvotes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {post.replyCount}
                      </span>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-primary-400 shrink-0 mt-1 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-slate-700 rounded-lg text-slate-400
                       hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-xs text-slate-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-slate-700 rounded-lg text-slate-400
                       hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
