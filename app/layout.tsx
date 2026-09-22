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
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: "(function(){try{var t=localStorage.getItem('mama-theme')||'system';var r=t==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.dataset.theme=r;document.documentElement.style.colorScheme=r}catch(e){}})()" }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
