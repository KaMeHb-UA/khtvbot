import DB from '../db';
import { base64ToInt, fixChatId, intToBase64, serializeForHTML } from '../helpers';
import translate, { type Phrases } from '../l10n';
import { OPCODE, runString } from './opcodes';
import { type TGButton } from './markup';
import views, { View } from './views';
import dashboardView from './views/dashboard';

type UnionToIntersection<U> =(U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

type TranslationArgs = UnionToIntersection<Exclude<{ [x in View['text']]: Phrases[x] }[View['text']], Record<string, never>>>;

function arrayIncludes<T extends any[]>(array: T, searchElements: T) {
	for (const element of searchElements) {
		if (array.includes(element)) return true;
	}
	return false;
}

const staticOpcodeRunners = {
	[OPCODE.B64_TO_INT]: (base64: string) => ({
		returnImmidiately: false,
		result: base64ToInt(base64),
	}),
	[OPCODE.INT_TO_B64]: (int: number | bigint) => ({
		returnImmidiately: false,
		result: intToBase64(int),
	}),
};

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

	private async sendAdminStartMessage(adminId: number, adminName: string, groupId: number) {
		const { title: groupName } = await this.getChat(groupId);
		const view = dashboardView();
		const messageId = await this.sendMessage(view.text, adminId, 0, {
			userName: adminName,
			groupLink: 'https://t.me/c/' + fixChatId(groupId),
			groupName,
		}, view.buttons);
		await DB.removeAdminDashboardMessage(adminId);
		await DB.saveAdminDashboardMessage(adminId, messageId);
	}

	private async processAdminUpdate(groupId: number, message: any, callbackQuery: any): Promise<any> {
		if (message?.text === '/start') {
			await this.sendAdminStartMessage(message.chat.id, message.from.first_name, groupId);
			await this.deleteMessage(message.chat.id, message.message_id);
			return;
		}
		if (!callbackQuery?.data) return;
		const adminId = callbackQuery.message.chat.id;
		const currentDashboardMessage = await DB.getAdminDashboardMessage(adminId);
		const { title: groupName } = await this.getChat(groupId);
		const translationArgs: TranslationArgs = {
			userName: callbackQuery.message.from.first_name,
			groupLink: 'https://t.me/c/' + fixChatId(groupId),
			groupName,
		};
		await runString(callbackQuery.data, {
			[OPCODE.CHANGE_VIEW]: async (viewId: number | bigint) => {
				const view = (views as Record<number, () => View>)[Number(viewId)];
				const { text, buttons } = view();
				await this.editMessage(text, adminId, currentDashboardMessage, translationArgs, buttons);
				return {
					returnImmidiately: false,
					result: null,
				};
			},
			...staticOpcodeRunners,
		});
	}

	private async findGroupByAdminId(groups: number[], chatId: number) {
		for (const groupId of groups) {
			const admins = await this.getChatAdmins(groupId);
			if (admins.includes(chatId)) return groupId;
		}
		throw new Error(`User is not an admin`);
	}

	init(token: string, webhookSecret: string) {
		this.token = token;
		this.webhookSecret = webhookSecret;
	}

	async processUpdate(webhookSecret: string | null, update: any) {
		if (this.webhookSecret !== webhookSecret) {
			throw new Error('Error validating webhook secret');
		}
		const { update_id: updateId, message, callback_query: callbackQuery } = update;
		const { chat: { id: groupId } } = message || callbackQuery.message;
		if (await DB.updateExists(updateId)) return { waitUntil: Promise.resolve() };
		await DB.addUpdate(updateId, groupId, message ? this.getMessageType(message): 'callback_query', message || callbackQuery);
		const availableGroups = (await DB.groupList()).map(({ id }) => id);
		if (!availableGroups.includes(groupId)) {
			let targetGroup = 0;
			try {
				targetGroup = await this.findGroupByAdminId(availableGroups, groupId);
			} catch(e) {
				throw new Error('Error validating chat id');
			}
			const res = await this.processAdminUpdate(targetGroup, message, callbackQuery);
			return {
				waitUntil: res && 'waitUntil' in res ? res.waitUntil : Promise.resolve(),
			};
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

	async sendMessage<T extends keyof Phrases>(type: T, chatId: number, replyTo: number, args: Phrases[T], buttons?: TGButton[][]) {
		const { message_id: id } = await this.call('sendMessage', {
			chat_id: chatId,
			parse_mode: 'HTML',
			text: translate('uk', type, args),
			...(
				replyTo ? {
					reply_to_message_id: replyTo,
					allow_sending_without_reply: true,
				} : {}
			),
			...(
				buttons?.length ? {
					reply_markup: {
						inline_keyboard: buttons,
					},
				} : {}
			),
		});
		return id as number;
	}

	async getChatAdmins(chatId: number) {
		const res = await this.call('getChatAdministrators', {
			chat_id: chatId,
		});
		return (res as any[]).map((admin) => admin.user.id as number);
	}

	async getChat(chatId: number) {
		return await this.call('getChat', {
			chat_id: chatId,
		});
	}

	async editMessage<T extends keyof Phrases>(type: T, chatId: number, messageId: number, args: Phrases[T], buttons?: TGButton[][]) {
		const res = await this.call('editMessageText', {
			chat_id: chatId,
			message_id: messageId,
			parse_mode: 'HTML',
			text: translate('uk', type, args),
			reply_markup: {
				inline_keyboard: buttons,
			},
		});
	}
}
