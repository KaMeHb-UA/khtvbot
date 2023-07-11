type Secrets = 'BOT_TOKEN' | 'BOT_WEBHOOK_SECRET' | 'SUPABASE_URL' | 'SUPABASE_KEY';

type Variables = never;

type RestEnvironment = Record<never, never>;

export type Environment = Record<Secrets, string> & Record<Variables, string> & RestEnvironment;

export type Context = {
	waitUntil: (promise: Promise<void>) => void;
}

export type ScheduledEvent = {
	cron: string;
	type: 'scheduled';
	scheduledTime: number;
};
