import fs from 'node:fs';
import path from 'node:path';

function listDirectories(targetPath: string, excluded: string[] = []) {
  return fs
    .readdirSync(targetPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !excluded.includes(entry.name))
    .map((entry) => entry.name)
    .sort();
}

function extractObjectKeys(filePath: string, objectName: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const objectMatch = content.match(new RegExp(`${objectName} = \\{([\\s\\S]*?)\\}\\s*(?:as const|satisfies)`));
  if (!objectMatch) {
    throw new Error(`Could not find ${objectName} in ${filePath}`);
  }

  return objectMatch[1]
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/,$/, ''))
    .filter(Boolean)
    .map((line) => line.match(/^(['"])(.+?)\1\s*:|^([a-z][a-z0-9-]*)\s*:|^([a-z][a-z0-9-]*)$/i))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => match[2] ?? match[3] ?? match[4])
    .sort();
}

describe('runtime registry parity', () => {
  const root = process.cwd();

  it('keeps component manifests aligned with the runtime component map', () => {
    const manifestComponents = listDirectories(path.join(root, 'components'), ['_shared']);
    const runtimeComponents = extractObjectKeys(path.join(root, 'lib', 'runtime', 'component-registry.tsx'), 'runtimeComponentMap');
    expect(runtimeComponents).toEqual(manifestComponents);
  });

  it('keeps layout manifests aligned with the runtime layout map', () => {
    const manifestLayouts = listDirectories(path.join(root, 'layouts'), ['_shared']);
    const runtimeLayouts = extractObjectKeys(path.join(root, 'lib', 'runtime', 'layout-registry.tsx'), 'runtimeLayoutMap');
    expect(runtimeLayouts).toEqual(manifestLayouts);
  });

  it('keeps transition manifests aligned with the runtime transition map', () => {
    const manifestTransitions = listDirectories(path.join(root, 'transitions'));
    const runtimeTransitions = extractObjectKeys(path.join(root, 'lib', 'runtime', 'transition-presets.ts'), 'runtimeTransitionMap');
    expect(runtimeTransitions).toEqual(manifestTransitions);
  });
});
