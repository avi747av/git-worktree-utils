import { execSync } from 'child_process';
import {
  parseArgs,
  isBranchCheckedOut,
  getMainRepoRoot,
  copyEnvFiles,
  exitWithError
} from './utils';

const args = parseArgs(process.argv.slice(2));

const branchName = args['branchName'] as string;
const dirName = args['dirName'] as string | undefined;

if (!branchName) {
  exitWithError('Missing --branchName=...');
}

const branch = branchName;
const dir = dirName || branchName;

// Check if branch is already checked out
const { checkedOut, location } = isBranchCheckedOut(branch);
if (checkedOut) {
  console.error(`Branch '${branch}' is already checked out at:`);
  console.error(location);
  process.exit(1);
}

// Fetch latest from remote to ensure we have up-to-date branch info
console.log('Fetching latest from remote...');
try {
  execSync('git fetch', { stdio: 'inherit' });
} catch {
  console.warn('Warning: git fetch failed, continuing anyway...');
}

// Check if branch exists locally
function branchExistsLocally(branchName: string): boolean {
  try {
    const result = execSync(`git branch --list ${branchName}`, { encoding: 'utf-8' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

// Check if branch exists on remote
function branchExistsOnRemote(branchName: string): boolean {
  try {
    const result = execSync(`git branch -r --list origin/${branchName}`, { encoding: 'utf-8' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

// Create the worktree
const targetPath = `../${dir}`;
try {
  console.log(`Creating worktree at ${targetPath} for branch ${branch}...`);

  if (branchExistsLocally(branch)) {
    // Branch exists locally, just check it out
    execSync(`git worktree add ${targetPath} ${branch}`, { stdio: 'inherit' });
  } else if (branchExistsOnRemote(branch)) {
    // Branch exists on remote but not locally, create local branch tracking remote
    execSync(`git worktree add -b ${branch} ${targetPath} origin/${branch}`, { stdio: 'inherit' });
  } else {
    // Branch doesn't exist anywhere, create a new branch
    console.log(`Branch '${branch}' not found locally or on remote, creating new branch...`);
    execSync(`git worktree add -b ${branch} ${targetPath}`, { stdio: 'inherit' });
    console.log(`\nTip: Run \`git push -u origin ${branch}\` to push and set up tracking, otherwise you'll get an error about setting upstream on first push.`);
  }
} catch {
  exitWithError('Failed to create worktree');
}

// Copy .env files
console.log('\nCopying .env files...');
const mainRoot = getMainRepoRoot();
const count = copyEnvFiles(mainRoot, `../${dir}`);
console.log(`Done copying ${count} .env file(s)`);
