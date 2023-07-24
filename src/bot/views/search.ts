import type { View, ViewArgs } from '.';
import bot from '..';
import DB from '../../db';
import { intToBase64 } from '../../helpers';
import { TGInlineButton } from '../markup';
import { OPCODE } from '../opcodes';
import { id as dashboardId } from './dashboard';

export const id = 0x04;

interface UserNameFields {
	first_name: string;
	last_name?: string;
	username?: string;
}

interface FilteredUser extends UserNameFields {
	weight: number;
	uid: number;
}

export default async ({ groupId, searchText, opcodeSequence, initialArgs }: ViewArgs): Promise<View> => {
	const admins = await bot.getChatAdmins(groupId);
	const filtered: FilteredUser[] = [];
	for (const { data, uid } of await DB.getLastUserUpdates(groupId, 999_999_999)) {
		if (admins.includes(uid!)) continue;
		const from: UserNameFields = (data as any)?.from || { first_name: '' };
		const searchParts = searchText!.split(/\s+/);
		let weight = 0;
		for (const searchSpecifier of searchParts) {
			const optionalSearchFields = from.last_name ? [from.last_name] : [];
			if (searchSpecifier.startsWith('@') && searchSpecifier.length > 1) {
				const nicknameSpecifier = searchSpecifier.slice(1);
				const { username = '' } = from;
				if (nicknameSpecifier === username) {
					weight += 1;
				} else if (username.includes(nicknameSpecifier)) {
					weight += nicknameSpecifier.length / username.length;
				}
			} else if (from.username) {
				optionalSearchFields.push(from.username);
			}
			for (const name of [from.first_name, ...optionalSearchFields]) {
				if (searchSpecifier === name) {
					weight += 1;
				} else if (name.includes(searchSpecifier)) {
					weight += searchSpecifier.length / name.length;
				}
			}
		}
		if (weight) {
			filtered.push({ ...from, weight, uid: uid! });
		}
	}
	const dynamicRows = filtered.sort((a, b) => b.weight - a.weight).slice(0, 10).map((user) => [
		new TGInlineButton(
			`👤 ${user.first_name}${user.last_name ? ' ' + user.last_name : ''}${user.username ? ` (@${user.username})` : ''}`,
			`${opcodeSequence}${OPCODE.B64_TO_INT}:${intToBase64(user.uid)}:${initialArgs!.join(':')}`,
			false,
		),
	]);
	return {
		text: 'admin_user_list',
		buttons: [
			...dynamicRows,
			[
				new TGInlineButton('admin_back_cmd', `${OPCODE.CHANGE_VIEW}${OPCODE.B64_TO_INT}:${intToBase64(dashboardId)}`),
			],
		],
	};
};
