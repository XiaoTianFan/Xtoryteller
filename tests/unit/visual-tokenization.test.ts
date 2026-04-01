import fs from 'node:fs/promises';
import path from 'node:path';

import { loadThemeBySlug } from '@/lib/engine/theme-registry';
import { resolveTheme } from '@/lib/engine/theme-resolver';

async function readWorkspaceFile(relativePath: string) {
  return fs.readFile(path.join(process.cwd(), relativePath), 'utf8');
}

describe('visual tokenization', () => {
  it('emits semantic visual token variables from shipped themes', async () => {
    const paperTheme = await loadThemeBySlug('xinimalist-paper');
    const resolved = resolveTheme(paperTheme);

    expect(
      resolved.cssVariables['--spacing-chrome-page-padding']
    ).toBeDefined();
    expect(
      resolved.cssVariables['--spacing-components-card-padding']
    ).toBeDefined();
    expect(
      resolved.cssVariables['--spacing-layouts-compact-padding']
    ).toBeDefined();
    expect(
      resolved.cssVariables['--size-components-feature-icon']
    ).toBeDefined();
    expect(
      resolved.cssVariables['--size-layouts-scattered-item-width']
    ).toBeDefined();
    expect(resolved.cssVariables['--text-components-stat-value']).toBeDefined();
    expect(
      resolved.cssVariables['--motion-components-list-offset-y']
    ).toBeDefined();
    expect(resolved.cssVariables['--radius-components-card']).toBeDefined();
    expect(resolved.cssVariables['--shadow-chrome-card']).toBeDefined();
    expect(resolved.cssVariables['--border-components-code']).toBeDefined();
  });

  it('routes dashboard and viewer shell styling through semantic tokens', async () => {
    const css = await readWorkspaceFile('app/globals.css');

    expect(css).toContain('padding: var(--spacing-chrome-page-padding);');
    expect(css).toContain(
      'max-width: var(--size-components-shell-hero-max-width);'
    );
    expect(css).toContain('font-size: var(--text-components-shell-hero);');
    expect(css).toContain(
      'max-height: var(--spacing-chrome-dock-open-height);'
    );
    expect(css).toContain(
      'width: min(var(--size-components-shell-shortcut-panel-width), 100%);'
    );
    expect(css).toContain('width: var(--size-components-shell-scrollbar);');
  });

  it('routes card-family components through shared semantic tokens', async () => {
    const css = await readWorkspaceFile('components/card/styles.module.css');

    expect(css).toContain('padding: var(--spacing-components-card-padding);');
    expect(css).toContain('border-radius: var(--radius-components-card);');
    expect(css).toContain('border: var(--border-components-card);');
    expect(css).toContain('box-shadow: var(--shadow-components-card);');
  });

  it('routes list-family components through semantic spacing and motion tokens', async () => {
    const bulletCss = await readWorkspaceFile(
      'components/bullet-list/styles.module.css'
    );
    const numberedCss = await readWorkspaceFile(
      'components/numbered-list/styles.module.css'
    );

    expect(bulletCss).toContain(
      'padding-left: var(--spacing-components-list-padding-start);'
    );
    expect(bulletCss).toContain(
      'transform: translateY(var(--motion-components-list-offset-y));'
    );
    expect(numberedCss).toContain(
      'padding-left: var(--spacing-components-list-numbered-padding-start);'
    );
    expect(numberedCss).toContain(
      'transform: translateY(var(--motion-components-list-offset-y));'
    );
  });

  it('routes timeline-family components through semantic spacing, sizing, and motion tokens', async () => {
    const itemCss = await readWorkspaceFile(
      'components/timeline-item/styles.module.css'
    );
    const timelineCss = await readWorkspaceFile(
      'components/timeline/styles.module.css'
    );

    expect(itemCss).toContain('width: var(--size-components-timeline-marker);');
    expect(itemCss).toContain(
      'padding: var(--spacing-components-timeline-item-padding);'
    );
    expect(timelineCss).toContain(
      'gap: var(--spacing-components-timeline-gap);'
    );
    expect(timelineCss).toContain(
      'transform: translateY(var(--motion-components-timeline-offset-y));'
    );
  });

  it('routes shared layout presentation values through layout token families', async () => {
    const css = await readWorkspaceFile('layouts/_shared/layout.module.css');

    expect(css).toContain('gap: var(--spacing-layouts-compact-gap);');
    expect(css).toContain('padding: var(--spacing-layouts-compact-padding);');
    expect(css).toContain(
      'width: min(var(--size-layouts-scattered-item-width), 32vw);'
    );
    expect(css).toContain(
      'left: var(--spacing-layouts-timeline-track-offset);'
    );
    expect(css).toContain(
      'min-width: var(--size-layouts-comparison-divider-min-width);'
    );
    expect(css).toContain(
      'width: var(--size-layouts-comparison-divider-badge-size);'
    );
  });
});
