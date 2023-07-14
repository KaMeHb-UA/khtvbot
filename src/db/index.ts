import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Database } from './schema';

export default new class DB {
	private client = (null as unknown as SupabaseClient<Database>);

	private cache: Record<string, any> = Object.create(null);

	init(url: string, key: string) {
		this.client = createClient<Database>(url, key, { global: { fetch } });
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

	async saveGreeting(chatId: number, messageId: number) {
		await this.client.from('greetings').insert({ chat_id: chatId, message_id: messageId });
	}

	async removeGreeting(chatId: number, messageId: number) {
		await this.client.from('greetings').delete().eq('chat_id', chatId).eq('message_id', messageId);
	}

	async getGreetings(before: Date) {
		const res = await this.client.from('greetings').select().lte('datetime', before.toISOString());
		return res.data || [];
	}

	async saveAdminDashboardMessage(uid: number, messageId: number) {
		await this.client.from('admin_start_messages').insert({ uid, message_id: messageId });
	}

	async getAdminDashboardMessage(uid: number) {
		const res = await this.client.from('admin_start_messages').select('message_id').eq('uid', uid).single();
		if (!res.data) throw new Error(`Can't find admin start message for uid ${uid}`);
		return res.data.message_id;
	}

	async removeAdminDashboardMessage(uid: number) {
		await this.client.from('admin_start_messages').delete().eq('uid', uid);
	}
}
