import { execSync } from 'child_process';
import { parseArgs } from './utils';

const args = parseArgs(process.argv.slice(2));
const search = args['search'] as string | undefined;

const list = execSync('git worktree list', { encoding: 'utf-8' }).trim();

if (!search) {
  console.log(list);
  process.exit(0);
}

const lines = list.split('\n');
const matches = lines.filter(line => line.toLowerCase().includes(search.toLowerCase()));

if (matches.length === 0) {
  console.error(`No worktree found matching: ${search}`);
  process.exit(1);
}

console.log(matches.join('\n'));
