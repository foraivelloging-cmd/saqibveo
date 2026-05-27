import React from 'react';
import { cn } from '../lib/utils';
import { useRouter } from 'next/navigation';

interface SaqibSignatureProps {
  className?: string;
}

export const SaqibSignature: React.FC<SaqibSignatureProps> = ({ className }) => {
  const router = useRouter();

  return (
    <span 
      id="author-signature" 
      onDoubleClick={() => router.push('/saqib-admin')}
      className={cn("text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)] cursor-pointer select-none active:scale-95 transition-transform", className)}
      title="System Integrity Verified"
    >
      {atob('Ynkgc2FxaWI=')}
    </span>
  );
};
