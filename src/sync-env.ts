import {
  parseArgs,
  getCurrentWorktreeRoot,
  getWorktreeListPaths,
  copyEnvFiles,
  exitWithError
} from './utils';
import { existsSync } from 'fs';
import { join } from 'path';

const args = parseArgs(process.argv.slice(2));

const to = args['to'] as string | undefined;
const all = args['all'] as boolean | undefined;

if (!to && !all) {
  console.log('Usage:');
  console.log('  npm run worktree:sync-env -- --to=<dirName>   # sync to specific worktree');
  console.log('  npm run worktree:sync-env -- --all            # sync to all other worktrees');
  process.exit(1);
}

const currentRoot = getCurrentWorktreeRoot();
let targets: string[] = [];

if (to) {
  const targetPath = join('..', to);
  if (!existsSync(targetPath)) {
    exitWithError(`Worktree not found: ${targetPath}`);
  }
  // Get absolute path
  const absPath = require('path').resolve(targetPath);
  targets = [absPath];
} else if (all) {
  // Get all worktrees except current
  targets = getWorktreeListPaths().filter(p => p !== currentRoot);
}

if (targets.length === 0) {
  console.log('No target worktrees found');
  process.exit(0);
}

console.log('Syncing .env files from current worktree...\n');

let totalCount = 0;
for (const target of targets) {
  console.log(`To: ${target}`);
  const count = copyEnvFiles(currentRoot, target);
  totalCount += count;
  console.log('');
}

console.log(`Done syncing ${totalCount} .env file(s) to ${targets.length} worktree(s)`);
