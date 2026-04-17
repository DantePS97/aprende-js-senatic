'use client';

import { useParams } from 'next/navigation';
import { ModuleForm } from '@/components/admin/ModuleForm';

export default function NewModulePage() {
  const { id } = useParams<{ id: string }>();
  return <ModuleForm mode="create" courseId={id} />;
}
