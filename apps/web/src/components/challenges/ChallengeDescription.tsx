'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ChallengeDescription({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none text-slate-300">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
