import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const args = process.argv.slice(2);
const command = args[0];

const commands: Record<string, string> = {
  add: 'add.js',
  list: 'list.js',
  ls: 'list.js',
  find: 'find.js',
  search: 'find.js',
  rename: 'rename.js',
  mv: 'rename.js',
  remove: 'remove.js',
  rm: 'remove.js',
  'sync-env': 'sync-env.js',
  sync: 'sync-env.js',
};

function showHelp() {
  console.log(`
git-worktree-utils - Safe git worktree management CLI

Usage: wt <command> [options]

Commands:
  add         Create a new worktree (with .env file copying)
  list, ls    List all worktrees
  find        Search worktrees by name
  rename, mv  Rename a worktree directory
  remove, rm  Remove a worktree (with safety checks)
  sync-env    Sync .env files to other worktrees

Options for 'add':
  --dirName=<name>      Directory name for the worktree (required)
  --branchName=<name>   Branch name (defaults to dirName)

Options for 'find':
  --search=<term>       Search term (case-insensitive)

Options for 'rename':
  --oldDirName=<name>   Current directory name (required)
  --newDirName=<name>   New directory name (required)

Options for 'remove':
  --dirName=<name>      Directory name to remove (required)

Options for 'sync-env':
  --to=<dirName>        Sync to specific worktree
  --all                 Sync to all other worktrees

Safety Features:
  - Blocks operations on main repository
  - Blocks remove/rename with uncommitted changes
  - Blocks remove/rename with unpushed commits
  - Checks if branch is already checked out elsewhere
  - Automatically copies .env files when creating worktrees

Examples:
  wt add --dirName=my-feature --branchName=feature/my-feature
  wt add --dirName=bugfix-123
  wt find --search=feature
  wt sync-env --all
  wt remove --dirName=old-feature
`);
}

if (!command || command === 'help' || command === '--help' || command === '-h') {
  showHelp();
  process.exit(0);
}

const scriptFile = commands[command];
if (!scriptFile) {
  console.error(`Unknown command: ${command}`);
  console.error('Run "wt help" for usage information');
  process.exit(1);
}

// Get the directory of this script
const __dirname = dirname(fileURLToPath(import.meta.url));
const scriptPath = resolve(__dirname, scriptFile);

// Forward remaining args to the command
const forwardArgs = args.slice(1).join(' ');

try {
  execSync(`node "${scriptPath}" ${forwardArgs}`, { stdio: 'inherit' });
} catch (error: any) {
  process.exit(error.status || 1);
}
