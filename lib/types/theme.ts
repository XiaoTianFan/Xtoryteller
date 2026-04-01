export interface FontRoleConfig {
  family: string;
  weights?: number[];
  source?: 'local' | 'google' | 'fontshare' | 'system';
  fallbacks?: string[];
  styles?: Array<'normal' | 'italic'>;
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  cssUrl?: string;
  files?: Array<{
    path: string;
    weight: number;
    style?: 'normal' | 'italic';
  }>;
}

export type ThemeTokenPrimitive = string | number;

export interface ThemeTokenGroup {
  [key: string]: ThemeTokenPrimitive | ThemeTokenPrimitive[] | ThemeTokenGroup;
}

export interface ThemeTypographyConfig extends ThemeTokenGroup {
  h1: string;
  h2: string;
  h3: string;
  body: string;
  small: string;
  lead: string;
  code: string;
  components: ThemeTokenGroup;
}

export interface ThemeSpacingConfig extends ThemeTokenGroup {
  page: string;
  section: string;
  gap: string;
  cluster: string;
  chrome: ThemeTokenGroup;
  components: ThemeTokenGroup;
  layouts: ThemeTokenGroup;
}

export interface ThemeSizingConfig extends ThemeTokenGroup {
  components: ThemeTokenGroup;
  layouts: ThemeTokenGroup;
}

export interface ThemeRadiiConfig extends ThemeTokenGroup {
  small: string;
  medium: string;
  large: string;
  pill: string;
}

export interface ThemeShadowsConfig extends ThemeTokenGroup {
  soft: string;
  strong: string;
}

export interface ThemeBordersConfig extends ThemeTokenGroup {
  subtle: string;
  strong: string;
}

export interface ThemeMotionConfig extends ThemeTokenGroup {
  fast: string;
  normal: string;
  slow: string;
  easing: string;
}

export interface ThemeConfig {
  name: string;
  fonts: {
    heading: FontRoleConfig;
    body: FontRoleConfig;
    mono: FontRoleConfig;
  };
  colors: Record<string, unknown>;
  typography: ThemeTypographyConfig;
  spacing: ThemeSpacingConfig;
  sizing: ThemeSizingConfig;
  radii: ThemeRadiiConfig;
  shadows: ThemeShadowsConfig;
  borders: ThemeBordersConfig;
  motion: ThemeMotionConfig;
}

export interface ResolvedTheme {
  theme: ThemeConfig;
  cssVariables: Record<string, string>;
}
