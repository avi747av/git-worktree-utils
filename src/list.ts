import { execSync } from 'child_process';
import { printHelpIfRequested } from './help';

printHelpIfRequested('list');

const output = execSync('git worktree list', { encoding: 'utf-8' });
console.log(output.trim());
