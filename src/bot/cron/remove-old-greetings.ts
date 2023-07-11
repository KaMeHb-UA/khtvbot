import bot from '..';
import DB from '../../db';

const oldGreetingTime = 1_800_000; // 30m

export const trigger = '*/30 * * * *'; // once per 30m

export async function processor() {
	const greetings = await DB.getGreetings(new Date(Date.now() - oldGreetingTime));
	for (const greeting of greetings) {
		await bot.deleteMessage(greeting.chat_id, greeting.message_id);
		await DB.removeGreeting(greeting.chat_id, greeting.message_id);
	}
};
