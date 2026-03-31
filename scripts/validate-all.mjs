import fg from 'fast-glob';
import { validatePresentation } from './validate.mjs';

const files = await fg('presentations/*/presentation.yaml', { absolute: true });

for (const file of files) {
  await validatePresentation(file);
}
