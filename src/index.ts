import './source-map';
import type { Environment, Context } from './platform';
import init from './init';
import bot from './bot';
import cron from './cron';
import ntfy from './ntfy';

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
			await ntfy(e as Error);
			return new Response((e as Error).message, {
				status: 500,
			});
		}
	},
	async scheduled(event: ScheduledEvent, env: Environment, context: Context) {
		init(env);
		try {
			const { waitUntil } = await cron(event.cron, env);
			context.waitUntil(waitUntil);
		} catch(e) {
			await ntfy(e as Error);
		}
	},
};
