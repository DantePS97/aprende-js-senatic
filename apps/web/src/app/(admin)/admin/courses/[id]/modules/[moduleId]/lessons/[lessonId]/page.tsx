'use client';

import { useParams } from 'next/navigation';
import { LessonForm } from '@/components/admin/LessonForm';

export default function EditLessonPage() {
  const { id, moduleId, lessonId } = useParams<{
    id: string;
    moduleId: string;
    lessonId: string;
  }>();

  return <LessonForm mode="edit" courseId={id} moduleId={moduleId} lessonId={lessonId} />;
}
