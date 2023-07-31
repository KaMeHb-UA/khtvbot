import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Database } from './schema';

export default new class DB {
	private client = (null as unknown as SupabaseClient<Database>);

	private cache: Record<string, any> = Object.create(null);

	init(url: string, key: string) {
		this.client = createClient<Database>(url, key, { global: { fetch }, auth: { persistSession: false } });
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

	async getLastUserUpdates(chatId: number, limit: number) {
		const res = await this.client.rpc('distinct_updates', {
			group_id: chatId,
			amount: limit,
		});
		return res.data as Database['public']['Tables']['updates']['Row'][] || [];
	}

	async getAdminDynamicInputScript(adminId: number) {
		const res = await this.client.from('admin_dynamic_inputs').select('script').eq('uid', adminId);
		const script = res.data?.[0]?.script;
		if (script) {
			await this.client.from('admin_dynamic_inputs').delete().eq('uid', adminId);
		}
		return script;
	}

	async setAdminDynamicInputScript(adminId: number, scriptToRun: string) {
		await this.client.from('admin_dynamic_inputs').insert({ uid: adminId, script: scriptToRun });
	}

	async acquireWarnSession(groupId: number, userId: number, adminId: number) {
		const res = await this.client.rpc('acquire_warn_session', {
			group_id: groupId,
			user_id: userId,
			admin: adminId,
		});
		return res.data as Database['public']['Tables']['warning_locks']['Row']['session'] | null;
	}

	async releaseWarnSession(groupId: number, userId: number) {
		await this.client.from('warning_locks').delete().eq('chat_id', groupId).eq('uid', userId);
	}

	async getUserWarnings(chatId: number, userId: number) {
		const res = await this.client.from('warnings').select('datetime').eq('chat_id', chatId).eq('uid', userId).order('datetime', { ascending: false });
		const warnings = (res.data || []).map(({ datetime }) => new Date(datetime!));
		return {
			amount: warnings.length,
			lastWarningTimeAgo: warnings.length ? Date.now() - Number(warnings[0]) : Infinity,
			list: warnings,
		};
	}

	async addUserWarning(chatId: number, userId: number) {
		await this.client.from('warnings').insert({ chat_id: chatId, uid: userId });
	}

	async getABFlag(name: string) {
		const res = await this.client.from('ab').select('user_ids').eq('flag', name).single();
		return res.data?.user_ids as number[] | undefined;
	}
}
