import { execSync } from 'child_process';

const output = execSync('git worktree list', { encoding: 'utf-8' });
console.log(output.trim());
