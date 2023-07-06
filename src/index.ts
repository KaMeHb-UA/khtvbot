import init from './init';
import DB from './db';

export default {
	async fetch(request: Request, env: Record<string, string>, ctx: any) {
		init(env);
		console.log('request:\n', request);
		console.log('\nenv:\n', env);
		console.log('\nctx:\n', ctx);
		console.log('\nGroup list:\n', await DB.groupList());
		return new Response('Hello World bundled!');
	},
};
