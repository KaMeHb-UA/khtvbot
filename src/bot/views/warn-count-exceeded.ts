import type { View, ViewArgs } from '.';
import { intToBase64 } from '../../helpers';
import { TGInlineButton } from '../markup';
import { OPCODE } from '../opcodes';
import { id as dashboardId } from './dashboard';

export const id = 0x09;

export default async ({ initialArgs: [ uid, firstName, lastName, username ] = [] }: ViewArgs): Promise<View> => {
	const targetUserName = `${firstName}${lastName ? ' ' + lastName : ''}${username ? ` (@${username})` : ''}`;
	return {
		text: 'admin_user_warn_count_exceeded',
		textTranslationArgs: {
			targetUserName,
			targetUserLink: `tg://user?id=${uid}`,
		},
		buttons: [[
			new TGInlineButton('admin_back_cmd', `${OPCODE.CHANGE_VIEW}${OPCODE.B64_TO_INT}:${intToBase64(dashboardId)}`),
		]],
	};
};
