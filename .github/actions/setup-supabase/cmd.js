import { spawn } from 'node:child_process';
import { env, stdout, stderr } from 'node:process';

export default (...cmd) => new Promise((resolve, reject) => {
	const output = [];
	const cp = spawn('yarn', ['exec', ...cmd], {
		stdio: 'pipe',
		cwd: env.GITHUB_WORKSPACE,
	});
	cp.stdout.on('error', reject);
	cp.stdout.on('data', (chunk) => {
		output.push(chunk);
		stdout.write(chunk);
	});
	cp.stderr.pipe(stderr);
	cp.once('error', reject);
	cp.on('close', (code) => {
		if (!code) return resolve(Buffer.concat(output).toString('utf8'));
		reject(new Error(`Command ${JSON.stringify(cmd)} exited with code ${code}`));
	});
});
