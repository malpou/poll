import { execSync } from 'node:child_process';

// Apply migrations to the local D1 before the preview server boots.
export default function globalSetup() {
	execSync('bun run d1:migrate', { stdio: 'inherit' });
}
