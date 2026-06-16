export const HELP_TEXTS: Record<string, string> = {
  add: `wt add - Create a new worktree (with .env file copying)

Usage:
  wt add --branchName=<name> [--dirName=<name>]

Options:
  --branchName=<name>   Branch name (required; created if it doesn't exist)
  --dirName=<name>      Directory name for the worktree (defaults to branchName)

Examples:
  wt add --branchName=feature/my-feature
  wt add --branchName=feature/my-feature --dirName=my-feature`,

  list: `wt list (alias: wt ls) - List all worktrees with status markers

Usage:
  wt list [--plain] [--sort]

Options:
  --plain   Output raw 'git worktree list' (no status markers)
  --sort    Show main repo first, then clean worktrees, then ones with markers

Status markers:
  [main]         The main repository (cannot be switched/renamed/removed)
  [dirty:N]      N files with uncommitted changes
  [unpushed:N]   N local commits not present on any remote
  [no-upstream]  Branch has no upstream tracking ref

Examples:
  wt list
  wt list --sort
  wt list --plain`,

  find: `wt find (alias: wt search) - Search worktrees by name (case-insensitive)

Usage:
  wt find --search=<term>

Options:
  --search=<term>       Search term

Examples:
  wt find --search=feature
  wt find --search=FS-1234`,

  rename: `wt rename (alias: wt mv) - Rename a worktree directory

Usage:
  wt rename --oldDirName=<name> --newDirName=<name>

Options:
  --oldDirName=<name>   Current directory name (required)
  --newDirName=<name>   New directory name (required)

Safety checks:
  - Blocks if uncommitted changes exist
  - Blocks if unpushed commits exist
  - Prevents renaming the main repository`,

  remove: `wt remove (alias: wt rm) - Remove a worktree

Usage:
  wt remove --dirName=<name>

Options:
  --dirName=<name>      Directory name to remove (required)

Safety checks:
  - Blocks if uncommitted changes exist
  - Blocks if unpushed commits exist
  - Prevents removing the main repository`,

  switch: `wt switch (alias: wt co, wt checkout) - Repoint an existing worktree at a different branch

Renames the worktree directory, checks out the target branch, and re-copies .env files.

Usage:
  wt switch --fromDirName=<name> --branchName=<name> [--toDirName=<name>]

Options:
  --fromDirName=<name>  Existing worktree directory (required)
  --branchName=<name>   Branch to switch to (required; created if it doesn't exist)
  --toDirName=<name>    New directory name (defaults to branchName)

Safety checks:
  - Blocks if uncommitted changes exist
  - Blocks if unpushed commits exist
  - Prevents switching the main repository
  - Blocks if target branch is checked out in another worktree

Examples:
  wt switch --fromDirName=old-feature --branchName=feature/new
  wt switch --fromDirName=old-feature --branchName=feature/new --toDirName=custom-dir`,

  'sync-env': `wt sync-env (alias: wt sync) - Sync .env files to other worktrees

Usage:
  wt sync-env --to=<dirName>
  wt sync-env --all

Options:
  --to=<dirName>        Sync to a specific worktree
  --all                 Sync to all other worktrees`,
};

const ALIASES: Record<string, string> = {
  ls: 'list',
  search: 'find',
  mv: 'rename',
  rm: 'remove',
  co: 'switch',
  checkout: 'switch',
  sync: 'sync-env',
};

export function resolveCommandKey(name: string): string | undefined {
  if (HELP_TEXTS[name]) return name;
  return ALIASES[name];
}

export function isHelpFlag(arg: string): boolean {
  return arg === '--help' || arg === '-h';
}

export function printHelpIfRequested(commandKey: string): void {
  if (process.argv.slice(2).some(isHelpFlag)) {
    const text = HELP_TEXTS[commandKey];
    if (text) {
      console.log(text);
      process.exit(0);
    }
  }
}
