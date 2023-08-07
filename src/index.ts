import './source-map';
import type { Environment, Context } from './platform';
import init from './init';
import bot from './bot';
import cron from './cron';
import ntfy from './ntfy';

class Controller {
	fetch = async (request: Request, env: Environment, context: Context) => {
		init(env);
		try {
			const token = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
			if (!token) {
				return new Response('Forbidden', {
					status: 403,
				});
			}
			const { waitUntil } = await bot.processUpdate(token, await request.json());
			context.waitUntil(waitUntil);
			return new Response('OK');
		} catch(e) {
			await ntfy(e as Error);
			return new Response((e as Error).message, {
				status: 500,
			});
		}
	}

	scheduled = async (event: ScheduledEvent, env: Environment, context: Context) => {
		init(env);
		try {
			const { waitUntil } = await cron(event.cron, env);
			context.waitUntil(waitUntil);
		} catch(e) {
			await ntfy(e as Error);
		}
	}
}

export default new Controller();
