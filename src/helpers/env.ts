import { env } from 'node:process';

export default (context: any, name: string) => {
	return env[name];
}
