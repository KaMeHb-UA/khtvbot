import fetch from './fetch';

let ntfyTopic = '';

function formatAdditionalData(data: Record<string, any>) {
	let res = '';
	for (const key of Object.keys(data)) {
		res += `${key} = ${JSON.stringify(data[key])}`;
	}
}

export default Object.assign(
	async function ntfy(content: Error | string) {
		const isError = typeof content !== 'string';
		const priority = isError ? 4 : 3;
		const stackLines = isError ? (content.stack || '').split('\n').map((line) => line.trim()) : [];
		const additionalInfo = isError ? JSON.stringify((content as any).additionalInfo || {}, null, '    ').slice(1, -1) : '';
		const errorMessage = stackLines.shift();
		await fetch(`https://ntfy.sh/${encodeURIComponent(ntfyTopic)}`, {
			method: 'POST',
			body: isError ? stackLines.join('\n') + additionalInfo : content,
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
