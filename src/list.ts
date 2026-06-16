import { execSync, exec } from 'child_process';
import { existsSync } from 'fs';
import { basename } from 'path';
import { promisify } from 'util';
import { parseArgs, getMainRepoRoot } from './utils';
import { printHelpIfRequested } from './help';

const execAsync = promisify(exec);

printHelpIfRequested('list');

const args = parseArgs(process.argv.slice(2));
const plain = args['plain'] as boolean;
const sort = args['sort'] as boolean;

const raw = execSync('git worktree list', { encoding: 'utf-8' }).trim();

if (plain) {
  console.log(raw);
  process.exit(0);
}

const isTTY = process.stdout.isTTY;
const RED = isTTY ? '\x1b[31m' : '';
const YELLOW = isTTY ? '\x1b[33m' : '';
const DIM = isTTY ? '\x1b[2m' : '';
const RESET = isTTY ? '\x1b[0m' : '';

interface WorktreeStatus {
  line: string;
  path: string;
  isMain: boolean;
  markers: string[];
  error?: string;
}

const mainRoot = getMainRepoRoot();
const lines = raw.split('\n');

async function check(path: string, gitArgs: string): Promise<string> {
  const { stdout } = await execAsync(`git -C "${path}" ${gitArgs}`);
  return stdout.trim();
}

async function inspect(line: string): Promise<WorktreeStatus> {
  const path = line.split(/\s+/)[0];
  const isMain = path === mainRoot;

  if (!existsSync(path)) {
    const name = basename(path);
    return {
      line,
      path,
      isMain,
      markers: [],
      error: `missing directory — run \`wt remove --dirName=${name}\``,
    };
  }

  try {
    const countLines = (s: string) => (s.length === 0 ? 0 : s.split('\n').length);
    const [dirtyCount, unpushedCount, hasUpstream] = await Promise.all([
      check(path, 'status --porcelain').then(countLines).catch(() => 0),
      check(path, 'rev-list HEAD --not --remotes').then(countLines).catch(() => 0),
      check(path, 'rev-parse --abbrev-ref --symbolic-full-name @{u}').then(() => true).catch(() => false),
    ]);

    const markers: string[] = [];
    if (dirtyCount > 0) markers.push(`dirty:${dirtyCount}`);
    if (unpushedCount > 0) markers.push(`unpushed:${unpushedCount}`);
    if (!hasUpstream) markers.push('no-upstream');

    return { line, path, isMain, markers };
  } catch (e: any) {
    return {
      line,
      path,
      isMain,
      markers: [],
      error: e.message?.split('\n')[0] || 'inspection failed',
    };
  }
}

const statuses = await Promise.all(lines.map(inspect));

if (sort) {
  statuses.sort((a, b) => {
    if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;
    const aClean = !a.error && a.markers.length === 0;
    const bClean = !b.error && b.markers.length === 0;
    if (aClean !== bClean) return aClean ? -1 : 1;
    return 0;
  });
}

for (const s of statuses) {
  let out = s.line;
  if (s.isMain) out += `  ${DIM}[main]${RESET}`;
  if (s.error) {
    out += `  ${RED}[${s.error}]${RESET}`;
  } else if (s.markers.length > 0) {
    out += '  ' + s.markers.map(m => `${YELLOW}[${m}]${RESET}`).join(' ');
  }
  console.log(out);
}

const dirtyExample = statuses.find(s => s.markers.some(m => m.startsWith('dirty:')));
const unpushedExample = statuses.find(s => s.markers.some(m => m.startsWith('unpushed:')));

if (dirtyExample || unpushedExample) {
  console.log('');
  console.log(`${DIM}Tips:${RESET}`);
  if (dirtyExample) {
    console.log(`  inspect dirty changes:    ${DIM}git -C "${dirtyExample.path}" status --short${RESET}`);
  }
  if (unpushedExample) {
    console.log(`  inspect unpushed commits: ${DIM}git -C "${unpushedExample.path}" log HEAD --not --remotes --oneline${RESET}`);
  }
}
