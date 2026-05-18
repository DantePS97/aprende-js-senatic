'use client';

import { useParams } from 'next/navigation';
import { ChallengeForm } from '@/components/admin/challenges/ChallengeForm';

export default function EditChallengePage() {
  const { id } = useParams<{ id: string }>();
  return <ChallengeForm mode="edit" challengeId={id} />;
}
