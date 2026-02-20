import { execSync } from 'child_process';
import {
  parseArgs,
  isBranchCheckedOut,
  getMainRepoRoot,
  copyEnvFiles,
  exitWithError
} from './utils';

const args = parseArgs(process.argv.slice(2));

const dirName = args['dirName'] as string;
const branchName = args['branchName'] as string | undefined;

if (!dirName) {
  exitWithError('Missing --dirName=...');
}

const branch = branchName || dirName;

// Check if branch is already checked out
const { checkedOut, location } = isBranchCheckedOut(branch);
if (checkedOut) {
  console.error(`Branch '${branch}' is already checked out at:`);
  console.error(location);
  process.exit(1);
}

// Create the worktree
const targetPath = `../${dirName}`;
try {
  console.log(`Creating worktree at ${targetPath} for branch ${branch}...`);
  execSync(`git worktree add ${targetPath} ${branch}`, { stdio: 'inherit' });
} catch {
  exitWithError('Failed to create worktree');
}

// Copy .env files
console.log('\nCopying .env files...');
const mainRoot = getMainRepoRoot();
const count = copyEnvFiles(mainRoot, `../${dirName}`);
console.log(`Done copying ${count} .env file(s)`);
