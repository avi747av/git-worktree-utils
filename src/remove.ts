import { execSync } from 'child_process';
import { existsSync, rmSync, renameSync } from 'fs';
import { join } from 'path';
import {
  parseArgs,
  isMainRepository,
  hasUncommittedChanges,
  hasUnpushedCommits,
  exitWithError
} from './utils';

const args = parseArgs(process.argv.slice(2));

const dirName = args['dirName'] as string;

if (!dirName) {
  exitWithError('Missing --dirName=...');
}

const path = join('..', dirName);

if (!existsSync(path)) {
  exitWithError(`Worktree not found: ${path}`);
}

if (isMainRepository(path)) {
  exitWithError('Cannot remove: that path is the main repository');
}

if (hasUncommittedChanges(path)) {
  exitWithError('Cannot remove: uncommitted changes in worktree');
}

if (hasUnpushedCommits(path)) {
  exitWithError('Cannot remove: unpushed commits in worktree');
}

// Move to tmp and delete in background
const tmpDir = `/tmp/worktree_${process.pid}`;
renameSync(path, tmpDir);

// Delete async
setImmediate(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

// Prune worktree references
execSync('git worktree prune', { stdio: 'inherit' });

console.log(`Removed worktree: ${dirName}`);
