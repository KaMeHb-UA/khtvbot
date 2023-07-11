import DB from '../db';
import { fixChatId, serializeForHTML } from '../helpers';
import translate, { type Phrases } from '../l10n';

function arrayIncludes<T extends any[]>(array: T, searchElements: T) {
	for (const element of searchElements) {
		if (array.includes(element)) return true;
	}
	return false;
}

export default new class TGBot {
	private token = '';
	private webhookSecret = '';

	private getMessageType(message: any) {
		const messageKeys = Object.keys(message);
		if (arrayIncludes(messageKeys, [
			'new_chat_member',
			'new_chat_members',
			'new_chat_participant',
			'left_chat_member',
			'left_chat_members',
			'left_chat_participant',
		])) {
			return 'chat_membership';
		}
		if (messageKeys.includes('animation')) return 'animation';
		if (messageKeys.includes('audio')) return 'audio';
		if (messageKeys.includes('photo')) return 'photo';
		if (messageKeys.includes('sticker')) return 'sticker';
		if (messageKeys.includes('video_note')) return 'circle';
		if (messageKeys.includes('video')) return 'video';
		if (messageKeys.includes('voice')) return 'voice';
		if (messageKeys.includes('contact')) return 'contact';
		if (messageKeys.includes('document')) return 'document';
		if (messageKeys.includes('text')) return 'text';
		return 'uncommon';
	}

	private async call(method: string, args?: any) {
		const res = await fetch(`https://api.telegram.org/bot${this.token}/${method}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(args),
		});
        const { ok, description, result } = await res.json<any>();
		if (!ok) throw new Error(description);
		return result;
	}

	private async replyWithWelcomeMessages(message: any, newChatMembers: any[]) {
		const groupRules: Record<string, number> = {};
		for (const { id, rules_message_id: rulesMessageId } of await DB.groupList()) {
			groupRules[id] = rulesMessageId;
		}
		for (const newMember of newChatMembers) {
			const messageId = await this.sendMessage('welcome', message.chat.id, message.message_id, {
				userLink: `tg://user?id=${newMember.id}`,
				userName: serializeForHTML(newMember.first_name),
				groupRulesLink: `tg://privatepost?channel=${fixChatId(message.chat.id)}&post=${groupRules[message.chat.id]}`,
				groupName: serializeForHTML(message.chat.title),
			});
			await DB.saveGreeting(message.chat.id, messageId);
		}
	}

	private async processMessageUpdate(message: any): Promise<any> {
		const newChatMembers: any[] = !message.new_chat_members?.length
			? message.new_chat_member || message.new_chat_participant
			? [message.new_chat_member || message.new_chat_participant]
			: []
			: message.new_chat_members;
		if (newChatMembers.length) {
			return await this.replyWithWelcomeMessages(message, newChatMembers);
		}
	}

	init(token: string, webhookSecret: string) {
		this.token = token;
		this.webhookSecret = webhookSecret;
	}

	async processUpdate(webhookSecret: string | null, update: any) {
		if (this.webhookSecret !== webhookSecret) {
			throw new Error('Error validating webhook secret');
		}
		const { update_id: updateId, message } = update;
		const { chat: { id: groupId } } = message;
		if (await DB.updateExists(updateId)) return { waitUntil: Promise.resolve() };
		await DB.addUpdate(updateId, groupId, this.getMessageType(message), message);
		const availableGroups = (await DB.groupList()).map(({ id }) => id);
		if (!availableGroups.includes(groupId)) {
			throw new Error('Error validating group id');
		}
		const res = await this.processMessageUpdate(message);
		return {
			waitUntil: res && 'waitUntil' in res ? res.waitUntil : Promise.resolve(),
		};
	}

	async deleteMessage(chatId: number, messageId: number) {
		await this.call('deleteMessage', {
			chat_id: chatId,
			message_id: messageId,
		});
	}

	async sendMessage<T extends keyof Phrases>(type: T, chatId: number, replyTo: number, args: Phrases[T]) {
		const { message_id: id } = await this.call('sendMessage', {
			chat_id: chatId,
			parse_mode: 'HTML',
			text: translate('uk', type, args),
			...(
				replyTo ? {
					reply_to_message_id: replyTo,
					allow_sending_without_reply: true,
				} : {}
			)
		});
		return id as number;
	}
}
