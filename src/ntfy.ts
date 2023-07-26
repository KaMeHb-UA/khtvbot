let ntfyTopic = '';

export default Object.assign(
	async function ntfy(content: Error | string) {
		const isError = typeof content !== 'string';
		const priority = isError ? 4 : 3;
		const stackLines = isError ? (content.stack || '').split('\n').map((line) => line.trim()) : [];
		const errorMessage = stackLines.shift();
		await fetch(`https://ntfy.sh/${encodeURIComponent(ntfyTopic)}`, {
			method: 'POST',
			body: isError ? stackLines.join('\n') : content,
			headers: {
				Priority: String(priority),
				...(isError ? { Title: errorMessage, Tags: 'rotating_light' } : {}),
			},
		});
	},
	{
		init(topic: string) {
			ntfyTopic = topic;
		},
	},
);
