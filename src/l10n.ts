function serializeForHTML(text: string) {
	return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function fixChatId(chatId: number) {
	const str = chatId.toString();
	if (str.startsWith('-100')) {
		return Number(str.slice(4));
	}
	return chatId;
}

export const welcome = ({
	userId,
	userName,
	groupId,
	groupName,
	groupRulesMessageId,
}: {
	userId: number;
	userName: string;
	groupId: number;
	groupName: string;
	groupRulesMessageId: number;
}) => `
Привіт, <a href="tg://user?id=${userId}">${serializeForHTML(userName)}</a>! Вітаємо в <b>${serializeForHTML(groupName)}</b>.
Просимо ознайомитися з <a href="tg://privatepost?channel=${fixChatId(groupId)}&post=${groupRulesMessageId}">правилами чату</a>. Мова чату — українська. За мовосрачі прилетить бан.
Приємного спілкування 😊
`;
