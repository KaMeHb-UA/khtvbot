import { appendFileSync } from 'node:fs';
import { env } from 'node:process';
import run from './cmd.js';

const outputMap = {
	'API URL': 'api-url',
	'DB URL': 'db-url',
	'Studio URL': 'studio-url',
	'Inbucket URL': 'inbucket-url',
	'JWT secret': 'jwt-secret',
	'anon key': 'anon-key',
	'service_role key': 'service-role-key',
};

const splitter = ': ';

run('supabase', 'start').then((output) => {
	for (const line of output.split('\n')) {
		const [name, ...value] = line.trim().split(splitter);
		if (value.length && (name in outputMap)) {
			appendFileSync(
				env.GITHUB_OUTPUT,
				`${outputMap[name]}=${value.join(splitter)}\n`,
				{
					encoding: 'utf8',
				},
			);
		}
	}
});
