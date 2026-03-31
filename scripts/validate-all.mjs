import fg from 'fast-glob';
import { validateTheme } from './validate-theme.mjs';
import { validatePresentation } from './validate.mjs';

const [presentationFiles, themeFiles] = await Promise.all([
  fg('presentations/*/presentation.yaml', { absolute: true }),
  fg('themes/*.yaml', { absolute: true })
]);

for (const file of themeFiles) {
  await validateTheme(file);
}

for (const file of presentationFiles) {
  await validatePresentation(file);
}
