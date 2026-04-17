'use client';

import { useParams } from 'next/navigation';
import { CourseForm } from '@/components/admin/CourseForm';

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  return <CourseForm mode="edit" courseId={id} />;
}
