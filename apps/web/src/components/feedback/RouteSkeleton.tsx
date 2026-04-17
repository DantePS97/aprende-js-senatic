'use client';

export type SkeletonVariant =
  | 'auth'
  | 'platform'
  | 'course'
  | 'lesson'
  | 'forum-post'
  | 'leaderboard';

const bar = (w: string, h = 'h-4') =>
  `animate-pulse bg-slate-800 rounded ${h} ${w}`;

function AuthSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className={bar('w-1/2 mx-auto', 'h-8')} />
        <div className={bar('w-full', 'h-12')} />
        <div className={bar('w-full', 'h-12')} />
        <div className={bar('w-full', 'h-10')} />
      </div>
    </div>
  );
}

function PlatformSkeleton() {
  return (
    <div className="min-h-screen px-4 pt-8 pb-24 flex flex-col gap-6 max-w-2xl mx-auto">
      <div className={bar('w-1/3', 'h-7')} />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className={bar('w-full', 'h-20')} />
        ))}
      </div>
    </div>
  );
}

function CourseSkeleton() {
  return (
    <div className="min-h-screen px-4 pt-6 pb-24 flex flex-col gap-5 max-w-2xl mx-auto">
      <div className={bar('w-2/3', 'h-7')} />
      <div className={bar('w-full', 'h-4')} />
      <div className={bar('w-1/2', 'h-4')} />
      <div className="flex flex-col gap-3 mt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={bar('w-full', 'h-14')} />
        ))}
      </div>
    </div>
  );
}

function LessonSkeleton() {
  return (
    <div className="min-h-screen pb-24 flex flex-col md:flex-row gap-4 px-4 pt-6">
      <div className="flex flex-col gap-3 flex-1">
        <div className={bar('w-1/2', 'h-6')} />
        <div className={bar('w-full', 'h-4')} />
        <div className={bar('w-full', 'h-4')} />
        <div className={bar('w-3/4', 'h-4')} />
        <div className={bar('w-full', 'h-40 mt-4')} />
      </div>
      <div className="hidden md:flex flex-col gap-3 w-72">
        {[1, 2, 3].map((i) => (
          <div key={i} className={bar('w-full', 'h-10')} />
        ))}
      </div>
    </div>
  );
}

function ForumPostSkeleton() {
  return (
    <div className="min-h-screen px-4 pt-6 pb-24 flex flex-col gap-4 max-w-2xl mx-auto">
      <div className={bar('w-2/3', 'h-7')} />
      <div className="flex gap-2">
        <div className={bar('w-16', 'h-5')} />
        <div className={bar('w-16', 'h-5')} />
      </div>
      <div className="flex flex-col gap-2">
        <div className={bar('w-full', 'h-4')} />
        <div className={bar('w-full', 'h-4')} />
        <div className={bar('w-4/5', 'h-4')} />
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div key={i} className={bar('w-full', 'h-16')} />
        ))}
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="min-h-screen px-4 pt-6 pb-24 flex flex-col gap-3 max-w-2xl mx-auto">
      <div className={bar('w-1/3', 'h-7')} />
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={bar('w-8', 'h-8')} />
          <div className={bar('w-8 rounded-full', 'h-8')} />
          <div className={bar('flex-1', 'h-5')} />
          <div className={bar('w-16', 'h-5')} />
        </div>
      ))}
    </div>
  );
}

const VARIANT_MAP: Record<SkeletonVariant, React.ReactNode> = {
  auth: <AuthSkeleton />,
  platform: <PlatformSkeleton />,
  course: <CourseSkeleton />,
  lesson: <LessonSkeleton />,
  'forum-post': <ForumPostSkeleton />,
  leaderboard: <LeaderboardSkeleton />,
};

export function RouteSkeleton({ variant }: { variant: SkeletonVariant }) {
  return (
    <div className="min-h-screen bg-surface-900">{VARIANT_MAP[variant]}</div>
  );
}
