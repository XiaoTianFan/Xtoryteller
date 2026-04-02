/**
 * Print viewer URLs for default style-preview slugs (same convention as create-style-previews.mjs).
 * Assumes dev server at http://localhost:3000 — change base with --base if needed.
 */
import { parseArgs } from './_utils.mjs';

const { options } = parseArgs(process.argv.slice(2));
const prefix = String(options.prefix ?? 'preview').trim() || 'preview';
const base = String(options.base ?? 'http://localhost:3000').replace(/\/$/, '');

const keys = ['a', 'b', 'c'];

console.log(`Preview URLs (prefix "${prefix}", base ${base}):`);
for (const key of keys) {
  console.log(`- ${base}/${prefix}-${key}`);
}
