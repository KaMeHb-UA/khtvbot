import DB from './db';
import * as l10n from './l10n';

type FunctionArgs<F> = F extends (...args: infer R) => any ? R : never;

function arrayIncludes<T extends any[]>(array: T, searchElements: T) {
	for (const element of searchElements) {
		if (array.includes(element)) return true;
	}
	return false;
}

function sleep(ms: number) {
	return new Promise<void>((r) => setTimeout(r, ms));
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

	private async deleteMessage(chatId: number, messageId: number) {
		await this.call('deleteMessage', {
			chat_id: chatId,
			message_id: messageId,
		});
	}

	private async sendMessage<T extends keyof typeof l10n>(type: T, chatId: number, replyTo: number, args: FunctionArgs<typeof l10n[T]>[0]) {
		const { message_id: id } = await this.call('sendMessage', {
			chat_id: chatId,
			parse_mode: 'HTML',
			text: l10n[type](args),
			...(
				replyTo ? {
					reply_to_message_id: replyTo,
					allow_sending_without_reply: true,
				} : {}
			)
		});
		return id as number;
	}

	private async replyWithWelcomeMessages(message: any, newChatMembers: any[]) {
		const groupRules: Record<string, number> = {};
		for (const { id, rules_message_id: rulesMessageId } of await DB.groupList()) {
			groupRules[id] = rulesMessageId;
		}
		for (const newMember of newChatMembers) {
			const messageId = await this.sendMessage('welcome', message.chat.id, message.message_id, {
				userId: newMember.id,
				userName: newMember.first_name,
				groupId: message.chat.id,
				groupName: message.chat.title,
				groupRulesMessageId: groupRules[message.chat.id],
			});
			return {
				waitUntil: sleep(3_600_000).then(() => this.deleteMessage(message.chat.id, messageId)),
			};
		}
	}

	private async processMessageUpdate(message: any) {
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
}
