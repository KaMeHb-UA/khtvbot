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

export function intToBase64(int: number | bigint) {
	const hex = int.toString(16);
	const bytes = [];
	for (let c = 0; c < hex.length; c += 2) {
		bytes.push(parseInt(hex.slice(c, c + 2), 16));
	}
	return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

export function base64ToInt(base64: string) {
	const binaryString = atob(base64);
	const bytes = [];
	for (let i = 0; i < binaryString.length; i++) {
		bytes.push(binaryString.charCodeAt(i).toString(16).padStart(2, '0'));
	}
	return BigInt('0x' + bytes.join(''));
}
