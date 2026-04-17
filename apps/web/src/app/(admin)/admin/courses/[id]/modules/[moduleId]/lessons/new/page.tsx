'use client';

import { useParams } from 'next/navigation';
import { LessonForm } from '@/components/admin/LessonForm';

export default function NewLessonPage() {
  const { id, moduleId } = useParams<{ id: string; moduleId: string }>();
  return <LessonForm mode="create" courseId={id} moduleId={moduleId} />;
}
