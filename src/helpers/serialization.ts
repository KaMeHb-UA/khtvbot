export function serializeForHTML(text: string) {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function fixChatId(chatId: number) {
	const str = chatId.toString();
	if (str.startsWith('-100')) {
		return Number(str.slice(4));
	}
	return chatId;
}
