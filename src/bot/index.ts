import DB from '../db';
import { base64ToInt, fixChatId, intToBase64, serializeForHTML } from '../helpers';
import translate, { type StaticTranslationArgs, type Phrases } from '../l10n';
import { OPCODE, runString } from './opcodes';
import { type TGButton } from './markup';
import views, { type View, type ViewArgs } from './views';
import dashboardView, { id as dashboardViewId } from './views/dashboard';
import { id as dataProcessingViewId } from './views/data-processing';
import { id as searchPromptViewId } from './views/search-prompt';
import { id as searchViewId } from './views/search';
import { id as banConfirmationViewId } from './views/ban-confirmation';
import { id as muteConfirmationViewId } from './views/mute-confirmation';
import { id as warnConfirmationViewId } from './views/warn-confirmation';
import { id as warnAlreadyProcessingViewId } from './views/warn-already-processing';
import { id as warnCountExceededViewId } from './views/warn-count-exceeded';
import { id as warnRecentViewId } from './views/warn-recent';

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
	[OPCODE.SHIFT_ARGS]: async (_previousResult: unknown, _restSequence: string, initialArgs: string[]) => ({
		returnImmidiately: false,
		result: initialArgs.shift(),
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
		const { title: groupName, invite_link: groupLink } = await this.getChat(groupId);
		const view = dashboardView();
		const messageId = await this.sendMessage(view.text, adminId, 0, {
			userName: adminName,
			groupLink,
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
		let setProcessingView = false;
		if (message?.text) {
			const scriptToRun = await DB.getAdminDynamicInputScript(message.chat.id);
			if (scriptToRun) {
				callbackQuery = {
					data: scriptToRun.replace('::', `${OPCODE.CHANGE_VIEW}${OPCODE.B64_TO_INT}:${intToBase64(searchViewId)}:`),
					message,
					from: message.from,
				};
				setProcessingView = true;
			}
		}
		if (!callbackQuery?.data) return;
		const adminId = callbackQuery.message.chat.id;
		const currentDashboardMessage = await DB.getAdminDashboardMessage(adminId);
		const { title: groupName, invite_link: groupLink } = await this.getChat(groupId);
		const translationArgs: StaticTranslationArgs = {
			userName: callbackQuery.from.first_name,
			groupLink,
			groupName,
		};
		const changeAdminView = async (viewId: number | bigint, restSequence?: string, initialArgs?: string[]) => {
			const view = (views as Record<number, (args: ViewArgs) => (View | Promise<View>)>)[Number(viewId)];
			const { text, textTranslationArgs, buttons } = await view({
				adminId: callbackQuery.from.id,
				groupId,
				searchText: message?.text,
				opcodeSequence: restSequence,
				initialArgs,
			});
			await this.editMessage(text, adminId, currentDashboardMessage, { ...translationArgs, ...textTranslationArgs }, buttons);
		};
		if (setProcessingView) {
			await this.deleteMessage(message.chat.id, message.message_id);
			await changeAdminView(dataProcessingViewId);
		}
		const warnUserRunner = (force: boolean) => async (userId: number | bigint) => {
			const uid = Number(userId);
			const warnings = await DB.getUserWarnings(groupId, uid);
			if (!force && warnings.lastWarningTimeAgo < (60_000 /* 1m */)) {
				const { user } = await this.getChatMember(groupId, uid);
				await changeAdminView(warnRecentViewId, undefined, [userId.toString(), user.first_name, user.last_name, user.username]);
				return {
					returnImmidiately: true,
					result: null,
				};
			}
			await DB.addUserWarning(groupId, uid);
			await this.warnChatMeber(groupId, uid, warnings.amount);
			await DB.releaseWarnSession(groupId, uid);
			return {
				returnImmidiately: false,
				result: null,
			};
		};
		await runString(callbackQuery.data, {
			[OPCODE.CHANGE_VIEW]: async (viewId: number | bigint, restSequence: string, initialArgs: string[]) => {
				await changeAdminView(viewId, restSequence, initialArgs);
				return {
					returnImmidiately: false,
					result: null,
				};
			},
			[OPCODE.BAN_USER]: async (userId: number | bigint) => {
				await this.banChatMember(groupId, Number(userId));
				await changeAdminView(dashboardViewId);
				await this.answerCallbackQuery(callbackQuery.id, 'admin_ban_success', {});
				return {
					returnImmidiately: false,
					result: null,
				};
			},
			[OPCODE.MUTE_USER]: async (userId: number | bigint) => {
				await this.muteChatMember(groupId, Number(userId));
				await changeAdminView(dashboardViewId);
				await this.answerCallbackQuery(callbackQuery.id, 'admin_mute_success', {});
				return {
					returnImmidiately: false,
					result: null,
				};
			},
			[OPCODE.SEARCH_USER]: async (_previousResult: unknown, restSequence: string, initialArgs: string[]) => {
				await DB.setAdminDynamicInputScript(adminId, `${restSequence}::${initialArgs.join(':')}`);
				await changeAdminView(searchPromptViewId);
				return {
					returnImmidiately: true,
					result: null,
				};
			},
			[OPCODE.BAN_CONFIRM]: async (userId: number | bigint) => {
				const { user } = await this.getChatMember(groupId, Number(userId));
				await changeAdminView(banConfirmationViewId, undefined, [userId.toString(), user.first_name, user.last_name, user.username]);
				return {
					returnImmidiately: false,
					result: null,
				};
			},
			[OPCODE.MUTE_CONFIRM]: async (userId: number | bigint) => {
				const { user } = await this.getChatMember(groupId, Number(userId));
				await changeAdminView(muteConfirmationViewId, undefined, [userId.toString(), user.first_name, user.last_name, user.username]);
				return {
					returnImmidiately: false,
					result: null,
				};
			},
			[OPCODE.WARN_CONFIRM]: async (userId: number | bigint) => {
				const uid = Number(userId);
				const [session, warnings, { user }] = await Promise.all([
					DB.acquireWarnSession(groupId, uid),
					DB.getUserWarnings(groupId, uid),
					this.getChatMember(groupId, uid),
				]);
				if (warnings.amount >= 3) {
					await changeAdminView(warnCountExceededViewId, undefined, [userId.toString(), user.first_name, user.last_name, user.username]);
					return {
						returnImmidiately: true,
						result: null,
					};
				}
				if (!session) {
					await changeAdminView(warnAlreadyProcessingViewId, undefined, [userId.toString(), user.first_name, user.last_name, user.username]);
					return {
						returnImmidiately: true,
						result: null,
					};
				}
				await changeAdminView(warnConfirmationViewId, undefined, [userId.toString(), user.first_name, user.last_name, user.username]);
				return {
					returnImmidiately: false,
					result: null,
				};
			},
			[OPCODE.WARN_USER]: warnUserRunner(false),
			[OPCODE.WARN_CANCEL]: async (userId: number | bigint) => {
				await DB.releaseWarnSession(groupId, Number(userId));
				return {
					returnImmidiately: false,
					result: null,
				};
			},
			[OPCODE.WARN_USER_FORCE]: warnUserRunner(true),
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
			disable_web_page_preview: true,
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
		await this.call('editMessageText', {
			chat_id: chatId,
			message_id: messageId,
			parse_mode: 'HTML',
			text: translate('uk', type, args),
			reply_markup: {
				inline_keyboard: buttons,
			},
		});
	}

	async banChatMember(groupId: number, userId: number) {
		await this.call('banChatMember', {
			chat_id: groupId,
			user_id: userId,
		});
		const { user } = await this.getChatMember(groupId, userId);
		await this.sendMessage('user_ban_message', groupId, 0, {
			userLink: `tg://user?id=${user.id}`,
			userFullNameWithNick: `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}${user.username ? ` (@${user.username})` : ''}`,
		});
	}

	async muteChatMember(groupId: number, userId: number) {
		await this.call('restrictChatMember', {
			chat_id: groupId,
			user_id: userId,
		});
		const { user } = await this.getChatMember(groupId, userId);
		await this.sendMessage('user_mute_message', groupId, 0, {
			userLink: `tg://user?id=${user.id}`,
			userName: user.first_name,
		});
	}

	async answerCallbackQuery<T extends keyof Phrases>(queryId: string, type: T, translationArgs: Phrases[T]) {
		await this.call('answerCallbackQuery', {
			callback_query_id: queryId,
			text: translate('uk', type, translationArgs),
		});
	}

	async getChatMember(chatId: number, memberId: number) {
		return await this.call('getChatMember', {
			chat_id: chatId,
			user_id: memberId,
		});
	}

	async warnChatMeber(groupId: number, userId: number, existingWarnAmount: number) {
		const nextWarn = existingWarnAmount + 1;
		if (nextWarn !== 1 && nextWarn !== 2 && nextWarn !== 3) return;
		const { user } = await this.getChatMember(groupId, userId);
		await this.sendMessage(`user_warn_message_${nextWarn}`, groupId, 0, {
			userLink: `tg://user?id=${user.id}`,
			userName: user.first_name,
			userFullNameWithNick: `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}${user.username ? ` (@${user.username})` : ''}`,
		});
	}
}
