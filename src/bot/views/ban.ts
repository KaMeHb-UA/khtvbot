import type { View, ViewArgs } from '.';
import DB from '../../db';
import { intToBase64 } from '../../helpers';
import { TGInlineButton } from '../markup';
import { OPCODE } from '../opcodes';
import { id as dashboardId } from './dashboard';

export const id = 0x01;

export default async ({ groupId }: ViewArgs): Promise<View> => {
	const lastUpdates = await DB.getLastUserUpdates(groupId, 18);
	const dynamicRows: TGInlineButton[][] = [];
	lastUpdates.forEach((update, i) => {
		if (!(i % 3)) dynamicRows.push([]);
		const lastRow = dynamicRows[dynamicRows.length - 1];
		const updateFrom = (update.data as any).from;
		const btnText = `👤 ${updateFrom.first_name}${updateFrom.last_name ? ' ' + updateFrom.last_name : ''}${updateFrom.username ? ` (@${updateFrom.username})` : ''}`;
		lastRow.push(new TGInlineButton(btnText, `${OPCODE.BAN_USER}${OPCODE.B64_TO_INT}:${intToBase64(updateFrom.id)}`, false));
	});
	return {
		text: 'admin_ban_view',
		buttons: [
			...dynamicRows,
			[
				new TGInlineButton('admin_back_cmd', `${OPCODE.CHANGE_VIEW}${OPCODE.B64_TO_INT}:${intToBase64(dashboardId)}`),
			],
		],
	};
};
