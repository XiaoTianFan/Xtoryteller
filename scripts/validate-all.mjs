import fg from 'fast-glob';

import { generateRegistries } from './generate-registries.mjs';
import { validateTheme } from './validate-theme.mjs';
import { validatePresentation } from './validate.mjs';

const counts = await generateRegistries();
console.log(
  `Registries refreshed (${counts.components} components, ${counts.layouts} layouts, ${counts.transitions} transitions, ${counts.themes} themes).`
);

const [presentationFiles, themeFiles] = await Promise.all([
  fg('presentations/*/presentation.yaml', { absolute: true }),
  fg('themes/*.yaml', { absolute: true })
]);

for (const file of themeFiles) {
  await validateTheme(file);
}

const slugToFiles = new Map();
let hasErrors = false;

for (const file of presentationFiles) {
  const result = await validatePresentation(file, { throwOnError: false });
  const bucket = slugToFiles.get(result.config.meta.slug) ?? [];
  bucket.push(file);
  slugToFiles.set(result.config.meta.slug, bucket);

  if (!result.valid) {
    hasErrors = true;
  }
}

for (const [slug, files] of slugToFiles.entries()) {
  if (files.length < 2) {
    continue;
  }

  hasErrors = true;
  console.error(`Duplicate presentation slug "${slug}" found in:`);
  for (const file of files) {
    console.error(`- ${file}`);
  }
}

if (hasErrors) {
  process.exit(1);
}
