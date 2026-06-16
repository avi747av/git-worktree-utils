import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { HELP_TEXTS, resolveCommandKey } from './help';

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
  switch: 'switch.js',
  co: 'switch.js',
  checkout: 'switch.js',
  'sync-env': 'sync-env.js',
  sync: 'sync-env.js',
};

function showGeneralHelp() {
  console.log(`
git-worktree-utils - Safe git worktree management CLI

Usage: wt <command> [options]
       wt help [command]
       wt <command> --help

Commands:
  add             Create a new worktree (with .env file copying)
  list, ls        List all worktrees
  find            Search worktrees by name
  rename, mv      Rename a worktree directory
  remove, rm      Remove a worktree (with safety checks)
  switch, co      Repoint an existing worktree at a different branch
  sync-env, sync  Sync .env files to other worktrees

Run \`wt help <command>\` or \`wt <command> --help\` for command-specific options.

Safety Features:
  - Blocks operations on main repository
  - Blocks remove/rename/switch with uncommitted changes
  - Blocks remove/rename/switch with unpushed commits
  - Checks if branch is already checked out elsewhere
  - Automatically copies .env files when creating worktrees

Examples:
  wt add --branchName=feature/my-feature
  wt switch --fromDirName=old-feature --branchName=feature/new
  wt rename --oldDirName=old-name --newDirName=new-name
  wt find --search=feature
  wt sync-env --all
  wt remove --dirName=old-feature
`);
}

function showCommandHelp(name: string): boolean {
  const key = resolveCommandKey(name);
  if (!key || !HELP_TEXTS[key]) return false;
  console.log(HELP_TEXTS[key]);
  return true;
}

if (!command || command === '--help' || command === '-h') {
  showGeneralHelp();
  process.exit(0);
}

if (command === 'help') {
  const sub = args[1];
  if (!sub) {
    showGeneralHelp();
    process.exit(0);
  }
  if (!showCommandHelp(sub)) {
    console.error(`Unknown command: ${sub}`);
    console.error('Run "wt help" for usage information');
    process.exit(1);
  }
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

// Forward remaining args to the command (each one is the per-command help-aware script)
const forwardArgs = args.slice(1).join(' ');

try {
  execSync(`node "${scriptPath}" ${forwardArgs}`, { stdio: 'inherit' });
} catch (error: any) {
  process.exit(error.status || 1);
}
