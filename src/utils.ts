import { execSync } from 'child_process';
import { existsSync, statSync, copyFileSync, mkdirSync } from 'fs';
import { dirname, join, relative } from 'path';
import fg from 'fast-glob';

export interface ParsedArgs {
  [key: string]: string | boolean;
}

export function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      result[key] = value ?? true;
    }
  }
  return result;
}

export function getMainRepoRoot(): string {
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
}

export function getCurrentWorktreeRoot(): string {
  return execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
}

export function getWorktreeList(): string[] {
  return execSync('git worktree list', { encoding: 'utf-8' }).trim().split('\n');
}

export function getWorktreeListPaths(): string[] {
  return getWorktreeList().map(line => line.split(/\s+/)[0]);
}

export function worktreeExists(dirName: string): boolean {
  const path = join('..', dirName);
  return existsSync(path) && statSync(path).isDirectory();
}

export function isBranchCheckedOut(branch: string): { checkedOut: boolean; location?: string } {
  const list = execSync('git worktree list', { encoding: 'utf-8' });
  const match = list.match(new RegExp(`^(.+?)\\s+\\w+\\s+\\[${branch}\\]`, 'm'));
  if (match) {
    return { checkedOut: true, location: match[1] };
  }
  return { checkedOut: false };
}

export function hasUncommittedChanges(path: string): boolean {
  const result = execSync(`git -C "${path}" status --porcelain`, { encoding: 'utf-8' });
  return result.trim().length > 0;
}

export function hasUnpushedCommits(path: string): boolean {
  try {
    const result = execSync(`git -C "${path}" rev-list HEAD --not --remotes 2>/dev/null`, { encoding: 'utf-8' });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

export function isMainRepository(path: string): boolean {
  const absPath = execSync(`cd "${path}" && pwd`, { encoding: 'utf-8' }).trim();
  const mainRoot = getMainRepoRoot();
  return absPath === mainRoot;
}

/**
 * Find all .env files in directories that contain package.json or project.json
 */
export function findEnvFilesInProjects(root: string): string[] {
  // Find all directories with package.json or project.json
  const projectFiles = fg.sync(['**/package.json', '**/project.json'], {
    cwd: root,
    ignore: ['**/node_modules/**'],
    absolute: true,
  });

  // Get unique directories
  const projectDirs = [...new Set(projectFiles.map(f => dirname(f)))];

  // Find .env files in those directories
  const envFiles: string[] = [];
  for (const dir of projectDirs) {
    const envs = fg.sync(['.env', '.env.*'], {
      cwd: dir,
      absolute: true,
      dot: true,
    });
    envFiles.push(...envs);
  }

  return envFiles;
}

export function copyEnvFiles(sourceRoot: string, targetRoot: string): number {
  const envFiles = findEnvFilesInProjects(sourceRoot);
  let count = 0;

  for (const sourcePath of envFiles) {
    const relPath = relative(sourceRoot, sourcePath);
    const targetPath = join(targetRoot, relPath);
    const targetDir = dirname(targetPath);

    mkdirSync(targetDir, { recursive: true });
    copyFileSync(sourcePath, targetPath);
    console.log(`  Copied: ${relPath}`);
    count++;
  }

  return count;
}

export function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}
