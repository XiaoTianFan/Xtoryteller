import path from 'node:path';

import { validateBackgroundPreset, validatePresentation } from '@/scripts/validate.mjs';
import { validateTheme } from '@/scripts/validate-theme.mjs';
import { vi } from 'vitest';

describe('validation fixtures', () => {
  it('accepts the global fallback theme', async () => {
    await expect(
      validateTheme(path.join(process.cwd(), 'themes', 'xinimalist-paper.yaml'))
    ).resolves.toBeUndefined();
    await expect(
      validateTheme(path.join(process.cwd(), 'themes', 'xinimalist-dark.yaml'))
    ).resolves.toBeUndefined();
  });

  it('rejects invalid presentation fixtures', async () => {
    const fixtures = [
      {
        name: 'missing asset',
        file: path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'presentations',
          'invalid',
          'missing-asset',
          'presentation.yaml'
        ),
        message: 'does not exist',
      },
      {
        name: 'duplicate step id',
        file: path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'presentations',
          'invalid',
          'duplicate-step-id',
          'presentation.yaml'
        ),
        message: 'Duplicate step id',
      },
      {
        name: 'anchor cycle',
        file: path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'presentations',
          'invalid',
          'anchor-cycle',
          'presentation.yaml'
        ),
        message: 'cycle',
      },
      {
        name: 'unsupported background param',
        file: path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'presentations',
          'invalid',
          'unsupported-background-param',
          'presentation.yaml'
        ),
        message: 'params.image is not supported',
      },
      {
        name: 'unsupported background preset',
        file: path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'presentations',
          'invalid',
          'unsupported-background-preset',
          'presentation.yaml'
        ),
        message: 'unsupported preset',
      },
      {
        name: 'unknown background preset ref',
        file: path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'presentations',
          'invalid',
          'unknown-background-preset-ref',
          'presentation.yaml'
        ),
        message: 'unknown background preset',
      },
      {
        name: 'css and preset ref conflict',
        file: path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'presentations',
          'invalid',
          'css-preset-ref-conflict',
          'presentation.yaml'
        ),
        message: 'cannot be combined with CSS-only fields',
      },
      {
        name: 'preset ref override param',
        file: path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'presentations',
          'invalid',
          'preset-ref-override-param',
          'presentation.yaml'
        ),
        message: 'params.image is not supported',
      },
      {
        name: 'css background filter',
        file: path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'presentations',
          'invalid',
          'background-filter-css',
          'presentation.yaml'
        ),
        message: 'filter is only supported on Paper shader backgrounds',
      },
      {
        name: 'background filter opacity',
        file: path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'presentations',
          'invalid',
          'background-filter-opacity',
          'presentation.yaml'
        ),
        message: 'opacity must be between 0 and 1',
      },
      {
        name: 'background filter radial size',
        file: path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'presentations',
          'invalid',
          'background-filter-radial-size',
          'presentation.yaml'
        ),
        message: 'radialSize.width must be between 0 and 1',
      },
      {
        name: 'background filter linear proportion',
        file: path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'presentations',
          'invalid',
          'background-filter-linear-proportion',
          'presentation.yaml'
        ),
        message: 'linearProportion must be between 0 and 1',
      },
      {
        name: 'non-positive cluster frame',
        file: path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'presentations',
          'invalid',
          'non-positive-cluster-frame',
          'presentation.yaml'
        ),
        message: 'frame/width must be > 0',
      },
      {
        name: 'mixed cluster anchor',
        file: path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'presentations',
          'invalid',
          'mixed-cluster-anchor',
          'presentation.yaml'
        ),
        message: 'cannot mix absolute anchor coordinates',
      },
    ] as const;

    for (const fixture of fixtures) {
      const result = await validatePresentation(fixture.file, {
        report: false,
        throwOnError: false,
      });
      expect(result.valid).toBe(false);
      expect(
        result.issues.some((issue) => issue.message.includes(fixture.message))
      ).toBe(true);
    }
  });

  it('accepts valid fixtures that use presentation-scoped primitives', async () => {
    const fixtures = [
      'local-runtime-overrides',
      'background-stage-switch',
      'background-map-switch',
      'background-filter-paper',
    ] as const;

    for (const fixture of fixtures) {
      const result = await validatePresentation(
        path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'presentations',
          'valid',
          fixture,
          'presentation.yaml'
        ),
        { report: false, throwOnError: false }
      );

      expect(result.valid).toBe(true);
      expect(
        result.issues.filter((issue) => issue.severity === 'error')
      ).toEqual([]);
    }
  });

  it('emits map migration warnings without failing valid fixtures', async () => {
    const legacySizing = await validatePresentation(
      path.join(
        process.cwd(),
        'tests',
        'fixtures',
        'presentations',
        'valid',
        'map-layout-props-warning',
        'presentation.yaml'
      ),
      { report: false, throwOnError: false }
    );

    expect(legacySizing.valid).toBe(true);
    expect(
      legacySizing.issues.some((issue) => issue.message.includes('deprecated layoutProps.width'))
    ).toBe(true);
    expect(
      legacySizing.issues.some((issue) => issue.message.includes('deprecated layoutProps.minHeight'))
    ).toBe(true);

    const arrangementPrecedence = await validatePresentation(
      path.join(
        process.cwd(),
        'tests',
        'fixtures',
        'presentations',
        'valid',
        'map-canvas-arrangement-precedence',
        'presentation.yaml'
      ),
      { report: false, throwOnError: false }
    );

    expect(arrangementPrecedence.valid).toBe(true);
    expect(
      arrangementPrecedence.issues.some((issue) => issue.message.includes('canvas.arrangement takes precedence'))
    ).toBe(true);
  });

  it('rejects invalid theme fixtures', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expect(
      validateTheme(
        path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'themes',
          'invalid',
          'missing-tokens.yaml'
        )
      )
    ).rejects.toThrow('Theme validation failed');

    expect(consoleError.mock.calls.flat().join('\n')).toContain(
      'spacing is missing required key "chrome.page-padding"'
    );
    consoleError.mockRestore();

    await expect(
      validateTheme(
        path.join(
          process.cwd(),
          'tests',
          'fixtures',
          'themes',
          'invalid',
          'missing-local-font.yaml'
        )
      )
    ).rejects.toThrow('Theme validation failed');
  });

  it('accepts shared background preset files', async () => {
    await expect(
      validateBackgroundPreset(
        path.join(process.cwd(), 'backgrounds', 'editorial-paper.yaml'),
        { report: false }
      )
    ).resolves.toMatchObject({ valid: true });
  });
});
