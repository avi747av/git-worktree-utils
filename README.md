# git-worktree-utils

A safe git worktree management CLI with automatic environment file syncing.

## Features

- **Safety checks** - Blocks operations with uncommitted changes or unpushed commits
- **Branch protection** - Warns if a branch is already checked out elsewhere
- **Main repo protection** - Prevents accidental operations on the main repository
- **Automatic .env copying** - Copies all `.env*` files when creating new worktrees
- **Environment syncing** - Sync `.env` files across worktrees with one command
- **Fuzzy search** - Find worktrees by partial name match

## Installation

```bash
npm install -g git-worktree-utils
```

## Usage

### Unified CLI

```bash
wt <command> [options]
```

### Individual Commands

```bash
wt-add [options]
wt-list
wt-find [options]
wt-rename [options]
wt-remove [options]
wt-sync-env [options]
```

## Commands

### `wt add` - Create a new worktree

Creates a new git worktree and automatically copies all `.env*` files from project directories.

```bash
wt add --dirName=my-feature --branchName=feature/my-feature
wt add --dirName=bugfix-123  # uses dirName as branch name
```

**Options:**
- `--dirName=<name>` - Directory name for the worktree (required)
- `--branchName=<name>` - Branch name (defaults to dirName)

### `wt list` (alias: `wt ls`)

Lists all git worktrees.

```bash
wt list
```

### `wt find` (alias: `wt search`)

Search worktrees by partial name match (case-insensitive).

```bash
wt find --search=feature
wt find --search=FS-1234
```

### `wt rename` (alias: `wt mv`)

Rename a worktree directory with safety checks.

```bash
wt rename --oldDirName=old-name --newDirName=new-name
```

**Safety checks:**
- Blocks if uncommitted changes exist
- Blocks if unpushed commits exist
- Prevents renaming the main repository

### `wt remove` (alias: `wt rm`)

Remove a worktree with safety checks.

```bash
wt remove --dirName=old-feature
```

**Safety checks:**
- Blocks if uncommitted changes exist
- Blocks if unpushed commits exist
- Prevents removing the main repository

### `wt sync-env` (alias: `wt sync`)

Sync `.env*` files from current worktree to other worktrees.

```bash
wt sync-env --to=other-worktree  # sync to specific worktree
wt sync-env --all                 # sync to ALL other worktrees
```

## How .env Copying Works

When creating a worktree or syncing, the tool:

1. Finds all directories containing `package.json` or `project.json` (excluding `node_modules`)
2. Copies all `.env*` files (`.env`, `.env.local`, `.env.development`, etc.) to the same relative path in the target worktree

This is especially useful for monorepos where environment files are scattered across multiple projects.

## Examples

### Typical Workflow

```bash
# Create a new feature worktree
wt add --dirName=my-feature --branchName=feature/awesome

# ... work on the feature, add new .env variables ...

# Sync your .env changes to all other worktrees
wt sync-env --all

# Find a specific worktree
wt find --search=awesome

# Clean up when done
wt remove --dirName=my-feature
```

### Use with npm scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "wt:add": "wt add",
    "wt:list": "wt list",
    "wt:sync": "wt sync-env --all"
  }
}
```

## License

MIT

## Author

Avi Weiss
