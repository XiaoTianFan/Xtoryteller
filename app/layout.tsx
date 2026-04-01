import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import { GLOBAL_THEME_COOKIE_NAME, loadThemeWithFallback } from '@/lib/engine/theme-registry';
import { ThemeProvider } from '@/lib/runtime/providers/theme-provider';
import { DevWatcher } from '@/lib/runtime/ui/dev-watcher';

export const metadata: Metadata = {
  title: 'Xtoryteller',
  description: 'Self-hosted, agent-first presentation infrastructure.'
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const { theme: shellTheme } = await loadThemeWithFallback(cookieStore.get(GLOBAL_THEME_COOKIE_NAME)?.value);

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
