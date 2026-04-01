import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();

function runGit(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];

    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(Buffer.concat(stdout).toString('utf8'));
        return;
      }

      reject(
        new Error(
          Buffer.concat(stderr).toString('utf8').trim() ||
            `git ${args.join(' ')} failed with code ${code ?? 'unknown'}`
        )
      );
    });
  });
}

function parsePorcelainStatus(output) {
  return output
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const rawPath = line.slice(3);
      const filePath = rawPath.includes(' -> ')
        ? rawPath.split(' -> ').at(-1)
        : rawPath;
      return filePath.replaceAll('/', path.sep);
    });
}

async function hashTrackedPath(filePath) {
  const absolutePath = path.join(root, filePath);

  try {
    const stats = await fs.stat(absolutePath);
    if (stats.isDirectory()) {
      return '__DIR__';
    }

    const content = await fs.readFile(absolutePath);
    return createHash('sha256').update(content).digest('hex');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return '__MISSING__';
    }

    throw error;
  }
}

export async function captureTrackedFileState() {
  const dirtyPaths = parsePorcelainStatus(
    await runGit(['status', '--short', '--untracked-files=no'])
  );
  const hashes = new Map();

  for (const filePath of dirtyPaths) {
    hashes.set(filePath, await hashTrackedPath(filePath));
  }

  return {
    dirtyPaths: new Set(dirtyPaths),
    hashes,
  };
}

export async function assertTrackedFilesUnchanged(label, beforeState) {
  const dirtyPaths = parsePorcelainStatus(
    await runGit(['status', '--short', '--untracked-files=no'])
  );
  const afterDirtyPaths = new Set(dirtyPaths);
  const newlyDirtyPaths = dirtyPaths.filter(
    (filePath) => !beforeState.dirtyPaths.has(filePath)
  );
  const changedExistingPaths = [];

  for (const filePath of beforeState.dirtyPaths) {
    if (!afterDirtyPaths.has(filePath)) {
      continue;
    }

    const beforeHash = beforeState.hashes.get(filePath);
    const afterHash = await hashTrackedPath(filePath);
    if (beforeHash !== afterHash) {
      changedExistingPaths.push(filePath);
    }
  }

  if (newlyDirtyPaths.length === 0 && changedExistingPaths.length === 0) {
    return;
  }

  const messages = [
    `${label} changed tracked files. Deterministic QA commands must leave the tracked tree untouched.`,
  ];

  if (newlyDirtyPaths.length > 0) {
    messages.push('', 'Newly modified tracked files:');
    for (const filePath of newlyDirtyPaths) {
      messages.push(`- ${filePath}`);
    }
  }

  if (changedExistingPaths.length > 0) {
    messages.push('', 'Previously dirty tracked files changed again:');
    for (const filePath of changedExistingPaths) {
      messages.push(`- ${filePath}`);
    }
  }

  throw new Error(messages.join('\n'));
}
