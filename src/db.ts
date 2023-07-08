import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export default new class DB {
	private client = (null as unknown as SupabaseClient);

	private cache: Record<string, any> = Object.create(null);

	init(url: string, key: string) {
		this.client = createClient(url, key, { global: { fetch } });
	}

	private async getCached<T>(cacheFieldName: string, load: () => Promise<T>) {
		if (!(cacheFieldName in this.cache)) {
			this.cache[cacheFieldName] = load().then((v) => (this.cache[cacheFieldName] = v));
		}
		return await this.cache[cacheFieldName] as T;
	}

	async updateExists(updateId: number) {
		const res = await this.client.from('updates').select('update_id').eq('update_id', updateId);
		return Boolean(res.data?.length);
	}

	async addUpdate(updateId: number, chatId: number, type: string, data: any) {
		await this.client.from('updates').insert({ update_id: updateId, chat_id: chatId, type, data, uid: data?.from?.id });
	}

	async groupList() {
		return this.getCached<{ id: number; rules_message_id: number }[]>(
			'groups',
			async () => {
				const res = await this.client.from('groups').select();
				return res.data || [];
			},
		)
	}
}
