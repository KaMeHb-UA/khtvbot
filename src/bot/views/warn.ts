import type { View, ViewArgs } from '.';
import bot from '..';
import DB from '../../db';
import { intToBase64 } from '../../helpers';
import { TGInlineButton } from '../markup';
import { OPCODE } from '../opcodes';
import { id as dashboardId } from './dashboard';

export const id = 0x0b;

const lastUsersLimit = 18;
const userColumns = 3;

export default async ({ groupId }: ViewArgs): Promise<View> => {
	const admins = await bot.getChatAdmins(groupId);
	const lastUpdates = await DB.getLastUserUpdates(groupId, lastUsersLimit + admins.length);
	const dynamicRows: TGInlineButton[][] = [];
	lastUpdates.filter((update) => !admins.includes(update.uid!)).slice(0, lastUsersLimit).forEach((update, i) => {
		if (!(i % userColumns)) dynamicRows.push([]);
		const lastRow = dynamicRows[dynamicRows.length - 1];
		const updateFrom = (update.data as any).from;
		const btnText = `👤 ${updateFrom.first_name}${updateFrom.last_name ? ' ' + updateFrom.last_name : ''}${updateFrom.username ? ` (@${updateFrom.username})` : ''}`;
		lastRow.push(new TGInlineButton(btnText, `${OPCODE.WARN_CONFIRM}${OPCODE.B64_TO_INT}:${intToBase64(updateFrom.id)}`, false));
	});
	return {
		text: 'admin_warn_view',
		buttons: [
			...dynamicRows,
			[
				new TGInlineButton('admin_search_cmd', `${OPCODE.WARN_CONFIRM}${OPCODE.SEARCH_USER}`),
			],
			[
				new TGInlineButton('admin_back_cmd', `${OPCODE.CHANGE_VIEW}${OPCODE.B64_TO_INT}:${intToBase64(dashboardId)}`),
			],
		],
	};
};
