import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'MAMA · Your care, your journey',
  icons: { icon: '/favicon.svg' },
  description:
    'Your personal reproductive and maternal care companion. Track changes, prepare for visits and find trusted sources.',
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
