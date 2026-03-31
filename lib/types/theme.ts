export interface FontRoleConfig {
  family: string;
  weights?: number[];
  source?: 'local' | 'google' | 'fontshare' | 'system';
  fallbacks?: string[];
}

export interface ThemeConfig {
  name: string;
  fonts: {
    heading: FontRoleConfig;
    body: FontRoleConfig;
    mono: FontRoleConfig;
  };
  colors: Record<string, unknown>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  radii: Record<string, string>;
  shadows: Record<string, string>;
  borders: Record<string, string>;
  motion: Record<string, string | number>;
}

export interface ResolvedTheme {
  theme: ThemeConfig;
  cssVariables: Record<string, string>;
}
