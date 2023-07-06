import init from './init';
import bot from './bot';

export default {
	async fetch(request: Request, env: Record<string, string>) {
		init(env);
		try {
			await bot.processUpdate(
				request.headers.get('X-Telegram-Bot-Api-Secret-Token'),
				await request.json(),
			);
			return new Response('OK');
		} catch(e) {
			console.error(e);
			return new Response((e as Error).message, {
				status: 500,
			});
		}
	},
};
