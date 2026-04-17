'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ThumbsUp, MessageSquare, Tag, Send, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { ForumPost, ForumReply } from '@senatic/shared';

export default function ForumThreadPage() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [upvoting, setUpvoting] = useState(false);
  // replyId → { upvoted, count, loading }
  const [replyVotes, setReplyVotes] = useState<Record<string, { upvoted: boolean; count: number; loading: boolean }>>({});

  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyError, setReplyError] = useState('');
  const replyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api
      .get(`/forum/posts/${postId}`)
      .then(({ data }) => {
        const { post: p, replies: r } = data.data;
        setPost(p);
        setReplies(r);
        setUpvoteCount(p.upvotes);
        setUpvoted(p.hasUpvoted ?? false);
        // Inicializar estado de votos de cada reply desde el servidor
        const initialVotes: typeof replyVotes = {};
        for (const reply of r as ForumReply[]) {
          initialVotes[reply._id as string] = {
            upvoted: reply.hasUpvoted ?? false,
            count: reply.upvotes,
            loading: false,
          };
        }
        setReplyVotes(initialVotes);
      })
      .catch(() => router.push('/forum'))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, router]);

  const handleUpvote = async () => {
    if (upvoting || !post) return;
    setUpvoting(true);
    try {
      const { data } = await api.post(`/forum/posts/${postId}/upvote`);
      const didUpvote: boolean = data.data.upvoted;
      setUpvoted(didUpvote);
      setUpvoteCount((prev) => prev + (didUpvote ? 1 : -1));
    } catch {
      // ignore
    } finally {
      setUpvoting(false);
    }
  };

  const handleReplyUpvote = useCallback(async (replyId: string) => {
    setReplyVotes((prev) => ({
      ...prev,
      [replyId]: { ...prev[replyId], loading: true },
    }));
    try {
      const { data } = await api.post(`/forum/posts/${postId}/replies/${replyId}/upvote`);
      const didUpvote: boolean = data.data.upvoted;
      setReplyVotes((prev) => ({
        ...prev,
        [replyId]: {
          upvoted: didUpvote,
          count: prev[replyId].count + (didUpvote ? 1 : -1),
          loading: false,
        },
      }));
    } catch {
      setReplyVotes((prev) => ({
        ...prev,
        [replyId]: { ...prev[replyId], loading: false },
      }));
    }
  }, [postId]);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = replyBody.trim();
    if (!body) return;
    if (body.length < 10) {
      setReplyError('La respuesta debe tener al menos 10 caracteres.');
      return;
    }

    setSubmitting(true);
    setReplyError('');
    try {
      const { data } = await api.post(`/forum/posts/${postId}/replies`, { body });
      setReplies((prev) => [...prev, data.data]);
      setReplyBody('');
      setPost((prev) => prev ? { ...prev, replyCount: prev.replyCount + 1 } : prev);
    } catch {
      setReplyError('Error al enviar la respuesta. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500 animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (!post) return null;

  const isOwnPost = !!user && user._id === (post.author?._id as unknown as string);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al foro
      </button>

      {/* Post principal */}
      <article className="card space-y-4">
        {/* Autor + fecha */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-500/20 flex items-center justify-center
                          text-sm font-bold text-primary-400 shrink-0">
            {post.author?.displayName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{post.author?.displayName}</p>
            <p className="text-xs text-slate-500">{formatDate(post.createdAt)}</p>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-xl font-bold text-white leading-snug">{post.title}</h1>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 text-xs px-2 py-0.5 bg-slate-800
                           border border-slate-700 rounded-full text-slate-400"
              >
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Body */}
        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{post.body}</p>

        {/* Acciones */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-700">
          <button
            onClick={handleUpvote}
            disabled={upvoting}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              upvoted
                ? 'text-primary-400'
                : 'text-slate-500 hover:text-primary-400'
            } disabled:opacity-50`}
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{upvoteCount}</span>
          </button>

          <button
            onClick={() => replyRef.current?.focus()}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.replyCount} {post.replyCount === 1 ? 'respuesta' : 'respuestas'}</span>
          </button>
        </div>
      </article>

      {/* Respuestas */}
      {replies.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Respuestas ({replies.length})
          </h2>
          {replies.map((reply) => {
            const rid = reply._id as string;
            const vote = replyVotes[rid] ?? { upvoted: false, count: reply.upvotes, loading: false };
            return (
              <div key={rid} className="card space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center
                                  text-xs font-bold text-slate-300 shrink-0">
                    {reply.author?.displayName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{reply.author?.displayName}</p>
                    <p className="text-xs text-slate-600">{formatDate(reply.createdAt)}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed pl-10">
                  {reply.body}
                </p>
                <div className="pl-10">
                  <button
                    onClick={() => handleReplyUpvote(rid)}
                    disabled={vote.loading}
                    className={`flex items-center gap-1 text-xs transition-colors ${
                      vote.upvoted
                        ? 'text-primary-400'
                        : 'text-slate-600 hover:text-primary-400'
                    } disabled:opacity-50`}
                  >
                    {vote.loading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ThumbsUp className="w-3 h-3" />
                    )}
                    <span>{vote.count}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Formulario de respuesta */}
      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">Tu respuesta</h2>
        <form onSubmit={handleReplySubmit} className="space-y-3">
          <textarea
            ref={replyRef}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Escribe tu respuesta aquí... (mínimo 10 caracteres)"
            rows={4}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5
                       text-sm text-slate-200 placeholder-slate-600
                       focus:outline-none focus:border-primary-500/60 resize-none transition-colors"
          />

          {replyError && (
            <p className="text-xs text-red-400">{replyError}</p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">
              {replyBody.length} caracteres
            </span>
            <button
              type="submit"
              disabled={submitting || replyBody.trim().length < 10}
              className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white
                         text-sm font-semibold px-4 py-2 rounded-lg transition-colors
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Responder
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
