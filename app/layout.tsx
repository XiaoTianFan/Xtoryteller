import type { Metadata } from 'next';
import './globals.css';
import { loadThemeBySlug } from '@/lib/engine/theme-registry';
import { ThemeProvider } from '@/lib/runtime/providers/theme-provider';
import { DevWatcher } from '@/lib/runtime/ui/dev-watcher';

export const metadata: Metadata = {
  title: 'Xtoryteller',
  description: 'Self-hosted, agent-first presentation infrastructure.'
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const shellTheme = await loadThemeBySlug('xinimalist-paper').catch(() => loadThemeBySlug('default'));

  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={shellTheme}>
          <DevWatcher />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
