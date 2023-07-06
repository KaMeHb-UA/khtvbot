import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export default new class DB {
	client = (null as unknown as SupabaseClient);

	init(url: string, key: string) {
		this.client = createClient(url, key, { global: { fetch } });
	}

	async groupList() {
		return await this.client.from('groups').select();
	}
}
