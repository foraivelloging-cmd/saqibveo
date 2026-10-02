import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '1Supashort',
  description: 'An open-source URL shortener powered by Supabase.',
  openGraph: {
    title: '1Supashort',
    description: 'An open-source URL shortener powered by Supabase.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
