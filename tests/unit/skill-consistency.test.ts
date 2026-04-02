import { describe, expect, it } from 'vitest';

import { validateSkillConsistency } from '../../scripts/validate-skill-consistency.mjs';

describe('skill package consistency', () => {
  it('matches init script, SKILL structure, manifest, and quick-route matrix', async () => {
    await expect(validateSkillConsistency()).resolves.toBeUndefined();
  });
});
