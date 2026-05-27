'use client';
import { use } from 'react';
import Redirect from '../../views/Redirect';

export default function Page({ params }: { params: Promise<{ shortCode: string }> }) {
  const resolvedParams = use(params);
  return <Redirect shortCode={resolvedParams.shortCode} />;
}
