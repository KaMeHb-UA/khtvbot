import type { Environment } from './platform';
import bot from './bot';
import DB from './db';
import ntfy from './ntfy';

export default function init({ BOT_TOKEN, BOT_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_KEY, NTFY_TOPIC }: Environment) {
	bot.init(BOT_TOKEN, BOT_WEBHOOK_SECRET);
	DB.init(SUPABASE_URL, SUPABASE_KEY);
	ntfy.init(NTFY_TOPIC);
}
