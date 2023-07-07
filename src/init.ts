import bot from './bot';
import DB from './db';

export default function init({ BOT_TOKEN, BOT_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_KEY }: Record<string, string>) {
	bot.init(BOT_TOKEN, BOT_WEBHOOK_SECRET);
	DB.init(SUPABASE_URL, SUPABASE_KEY);
}
