import type { View, ViewArgs } from '.';
import { intToBase64 } from '../../helpers';
import { TGInlineButton } from '../markup';
import { OPCODE } from '../opcodes';
import { id as dashboardId } from './dashboard';

export const id = 0x06;

export default async ({ initialArgs: [ uid, firstName, lastName, username ] = [] }: ViewArgs): Promise<View> => {
	const targetUserName = `${firstName}${lastName ? ' ' + lastName : ''}${username ? ` (@${username})` : ''}`;
	return {
		text: 'admin_user_ban_confirmation',
		textTranslationArgs: {
			targetUserName,
			targetUserLink: `tg://user?id=${uid}`,
		},
		buttons: [[
			new TGInlineButton('admin_confirmation_yes_cmd', `${OPCODE.BAN_USER}${OPCODE.B64_TO_INT}:${intToBase64(Number(uid))}`),
			new TGInlineButton('admin_confirmation_no_cmd', `${OPCODE.CHANGE_VIEW}${OPCODE.B64_TO_INT}:${intToBase64(dashboardId)}`),
		]],
	};
};
