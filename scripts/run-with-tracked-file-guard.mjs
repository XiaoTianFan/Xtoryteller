import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

import {
  assertTrackedFilesUnchanged,
  captureTrackedFileState,
} from './tracked-file-guard.mjs';

const [, , label, command, ...args] = process.argv;

if (!label || !command) {
  console.error(
    'Usage: node scripts/run-with-tracked-file-guard.mjs <label> <command> [...args]'
  );
  process.exit(1);
}

function runCommand(commandName, commandArgs) {
  const localBinName =
    process.platform === 'win32' ? `${commandName}.cmd` : commandName;
  const localBinPath = path.join(
    process.cwd(),
    'node_modules',
    '.bin',
    localBinName
  );
  const resolvedCommand =
    commandName.includes('/') ||
    commandName.includes('\\') ||
    !existsSync(localBinPath)
      ? commandName
      : localBinPath;

  return new Promise((resolve, reject) => {
    const child = spawn(resolvedCommand, commandArgs, {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: process.env,
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(`${commandName} exited with code ${code ?? 'unknown'}.`)
      );
    });
  });
}

const beforeState = await captureTrackedFileState();

let commandError;
try {
  await runCommand(command, args);
} catch (error) {
  commandError = error;
}

let guardError;
try {
  await assertTrackedFilesUnchanged(label, beforeState);
} catch (error) {
  guardError = error;
}

if (commandError || guardError) {
  const messages = [commandError?.message, guardError?.message].filter(Boolean);
  console.error(messages.join('\n\n'));
  process.exit(1);
}
