import fs from 'node:fs/promises';
import YAML from 'yaml';

export async function parseYamlFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8');
  return YAML.parse(raw) as T;
}

export function parseYamlString<T>(source: string): T {
  return YAML.parse(source) as T;
}
