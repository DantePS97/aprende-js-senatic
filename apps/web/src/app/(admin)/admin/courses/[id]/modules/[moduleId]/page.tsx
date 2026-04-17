'use client';

import { useParams } from 'next/navigation';
import { ModuleForm } from '@/components/admin/ModuleForm';

export default function EditModulePage() {
  const { id, moduleId } = useParams<{ id: string; moduleId: string }>();
  return <ModuleForm mode="edit" courseId={id} moduleId={moduleId} />;
}
