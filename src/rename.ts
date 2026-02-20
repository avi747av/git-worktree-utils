import { execSync } from 'child_process';
import { existsSync, renameSync } from 'fs';
import { join } from 'path';
import {
  parseArgs,
  isMainRepository,
  hasUncommittedChanges,
  hasUnpushedCommits,
  exitWithError
} from './utils';

const args = parseArgs(process.argv.slice(2));

const oldDirName = args['oldDirName'] as string;
const newDirName = args['newDirName'] as string;

if (!oldDirName) {
  exitWithError('Missing --oldDirName=...');
}

if (!newDirName) {
  exitWithError('Missing --newDirName=...');
}

const pathOld = join('..', oldDirName);
const pathNew = join('..', newDirName);

if (!existsSync(pathOld)) {
  exitWithError(`Worktree not found: ${pathOld}`);
}

if (existsSync(pathNew)) {
  exitWithError(`Destination already exists: ${pathNew}`);
}

if (isMainRepository(pathOld)) {
  exitWithError('Cannot rename: that path is the main repository');
}

if (hasUncommittedChanges(pathOld)) {
  exitWithError('Cannot rename: uncommitted changes in worktree');
}

if (hasUnpushedCommits(pathOld)) {
  exitWithError('Cannot rename: unpushed commits in worktree');
}

// Rename the directory
renameSync(pathOld, pathNew);

// Repair the worktree reference
const absPathNew = execSync(`cd "${pathNew}" && pwd`, { encoding: 'utf-8' }).trim();
execSync(`git worktree repair "${absPathNew}"`, { stdio: 'inherit' });

console.log(`Renamed worktree from ${oldDirName} to ${newDirName}`);
