import type { Metadata } from 'next';
import './globals.css';
import './world-finish.css';
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
          dangerouslySetInnerHTML={{ __html: "(function(){try{document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light';localStorage.setItem('mama-theme','light')}catch(e){}})()" }}
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
