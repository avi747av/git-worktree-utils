import { execSync } from 'child_process';
import { existsSync, renameSync } from 'fs';
import { join } from 'path';
import {
  parseArgs,
  isMainRepository,
  hasUncommittedChanges,
  hasUnpushedCommits,
  isBranchCheckedOut,
  getMainRepoRoot,
  copyEnvFiles,
  branchExistsLocally,
  branchExistsOnRemote,
  exitWithError
} from './utils';

const args = parseArgs(process.argv.slice(2));

const fromDirName = args['fromDirName'] as string;
const branchName = args['branchName'] as string;
const toDirName = (args['toDirName'] as string | undefined) || branchName;

if (!fromDirName) {
  exitWithError('Missing --fromDirName=...');
}

if (!branchName) {
  exitWithError('Missing --branchName=...');
}

const pathFrom = join('..', fromDirName);
const pathTo = join('..', toDirName);

if (!existsSync(pathFrom)) {
  exitWithError(`Worktree not found: ${pathFrom}`);
}

if (isMainRepository(pathFrom)) {
  exitWithError('Cannot switch: that path is the main repository');
}

if (hasUncommittedChanges(pathFrom)) {
  exitWithError('Cannot switch: uncommitted changes in worktree');
}

if (hasUnpushedCommits(pathFrom)) {
  exitWithError('Cannot switch: unpushed commits in worktree');
}

const { checkedOut, location } = isBranchCheckedOut(branchName);
if (checkedOut) {
  const absFrom = execSync(`cd "${pathFrom}" && pwd`, { encoding: 'utf-8' }).trim();
  if (location !== absFrom) {
    console.error(`Branch '${branchName}' is already checked out at:`);
    console.error(location!);
    process.exit(1);
  }
}

const willRename = fromDirName !== toDirName;
if (willRename && existsSync(pathTo)) {
  exitWithError(`Destination already exists: ${pathTo}`);
}

console.log('Fetching latest from remote...');
try {
  execSync('git fetch', { stdio: 'inherit' });
} catch {
  console.warn('Warning: git fetch failed, continuing anyway...');
}

let workingPath = pathFrom;
if (willRename) {
  console.log(`Renaming ${pathFrom} -> ${pathTo}...`);
  renameSync(pathFrom, pathTo);
  const absPathTo = execSync(`cd "${pathTo}" && pwd`, { encoding: 'utf-8' }).trim();
  execSync(`git worktree repair "${absPathTo}"`, { stdio: 'inherit' });
  workingPath = pathTo;
}

try {
  console.log(`Switching ${workingPath} to branch ${branchName}...`);
  if (branchExistsLocally(branchName)) {
    execSync(`git -C "${workingPath}" checkout ${branchName}`, { stdio: 'inherit' });
  } else if (branchExistsOnRemote(branchName)) {
    execSync(`git -C "${workingPath}" checkout -b ${branchName} origin/${branchName}`, { stdio: 'inherit' });
  } else {
    console.log(`Branch '${branchName}' not found locally or on remote, creating new branch...`);
    execSync(`git -C "${workingPath}" checkout -b ${branchName}`, { stdio: 'inherit' });
    console.log(`\nTip: Run \`git push -u origin ${branchName}\` to push and set up tracking.`);
  }
} catch {
  exitWithError('Failed to switch branch');
}

console.log('\nRe-copying .env files...');
const mainRoot = getMainRepoRoot();
const count = copyEnvFiles(mainRoot, workingPath);
console.log(`Done copying ${count} .env file(s)`);
console.log(`Worktree ${fromDirName} is now at ${toDirName} on branch ${branchName}`);
