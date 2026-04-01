import path from 'node:path';

import { validatePresentation } from '@/scripts/validate.mjs';
import { validateTheme } from '@/scripts/validate-theme.mjs';

describe('validation fixtures', () => {
  it('accepts the default theme', async () => {
    await expect(validateTheme(path.join(process.cwd(), 'themes', 'default.yaml'))).resolves.toBeUndefined();
  });

  it('rejects invalid presentation fixtures', async () => {
    const fixtures = [
      {
        name: 'missing asset',
        file: path.join(process.cwd(), 'tests', 'fixtures', 'presentations', 'invalid', 'missing-asset', 'presentation.yaml'),
        message: 'does not exist'
      },
      {
        name: 'duplicate step id',
        file: path.join(process.cwd(), 'tests', 'fixtures', 'presentations', 'invalid', 'duplicate-step-id', 'presentation.yaml'),
        message: 'Duplicate step id'
      },
      {
        name: 'anchor cycle',
        file: path.join(process.cwd(), 'tests', 'fixtures', 'presentations', 'invalid', 'anchor-cycle', 'presentation.yaml'),
        message: 'cycle'
      },
      {
        name: 'unsupported background param',
        file: path.join(process.cwd(), 'tests', 'fixtures', 'presentations', 'invalid', 'unsupported-background-param', 'presentation.yaml'),
        message: 'params.image is not supported'
      },
      {
        name: 'unsupported background preset',
        file: path.join(process.cwd(), 'tests', 'fixtures', 'presentations', 'invalid', 'unsupported-background-preset', 'presentation.yaml'),
        message: 'unsupported preset'
      }
    ] as const;

    for (const fixture of fixtures) {
      const result = await validatePresentation(fixture.file, { report: false, throwOnError: false });
      expect(result.valid).toBe(false);
      expect(result.issues.some((issue) => issue.message.includes(fixture.message))).toBe(true);
    }
  });

  it('accepts valid fixtures that use presentation-scoped primitives', async () => {
    const fixtures = [
      'local-runtime-overrides',
      'background-stage-switch',
      'background-map-switch'
    ] as const;

    for (const fixture of fixtures) {
      const result = await validatePresentation(
        path.join(process.cwd(), 'tests', 'fixtures', 'presentations', 'valid', fixture, 'presentation.yaml'),
        { report: false, throwOnError: false }
      );

      expect(result.valid).toBe(true);
      expect(result.issues.filter((issue) => issue.severity === 'error')).toEqual([]);
    }
  });

  it('rejects invalid theme fixtures', async () => {
    await expect(
      validateTheme(path.join(process.cwd(), 'tests', 'fixtures', 'themes', 'invalid', 'missing-tokens.yaml'))
    ).rejects.toThrow('Theme validation failed');

    await expect(
      validateTheme(path.join(process.cwd(), 'tests', 'fixtures', 'themes', 'invalid', 'missing-local-font.yaml'))
    ).rejects.toThrow('Theme validation failed');
  });
});

