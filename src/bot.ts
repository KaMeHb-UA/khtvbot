export default new class TGBot {
	private token = '';

	init(token: string) {
		this.token = token;
	}

	async call(method: string, args?: any) {
		const res = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(args),
		});
        const { ok, description, result } = await res.json<any>();
		if (!ok) throw new Error(description);
		return result;
	}
}
