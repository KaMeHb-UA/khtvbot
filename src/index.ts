import type { Environment, Context } from './platform';
import init from './init';
import bot from './bot';
import cron from './cron';

export default {
	async fetch(request: Request, env: Environment, context: Context) {
		init(env);
		try {
			const { waitUntil } = await bot.processUpdate(
				request.headers.get('X-Telegram-Bot-Api-Secret-Token'),
				await request.json(),
			);
			context.waitUntil(waitUntil);
			return new Response('OK');
		} catch(e) {
			console.error(e);
			return new Response((e as Error).message, {
				status: 500,
			});
		}
	},
	async scheduled(event: ScheduledEvent, env: Environment, context: Context) {
		init(env);
		const { waitUntil } = await cron(event.cron, env);
		context.waitUntil(waitUntil);
	},
};
