import type { Metadata } from 'next';
import './globals.css';
import { DevWatcher } from '@/lib/runtime/ui/dev-watcher';

export const metadata: Metadata = {
  title: 'Xtoryteller',
  description: 'Self-hosted, agent-first presentation infrastructure.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DevWatcher />
        {children}
      </body>
    </html>
  );
}
