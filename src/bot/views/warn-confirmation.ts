import type { View, ViewArgs } from '.';
import { intToBase64 } from '../../helpers';
import { TGInlineButton } from '../markup';
import { OPCODE } from '../opcodes';
import { id as dashboardId } from './dashboard';

export const id = 0x08;

export default async ({ initialArgs: [ uid, firstName, lastName, username ] = [] }: ViewArgs): Promise<View> => {
	const targetUserName = `${firstName}${lastName ? ' ' + lastName : ''}${username ? ` (@${username})` : ''}`;
	return {
		text: 'admin_user_warn_confirmation',
		textTranslationArgs: {
			targetUserName,
			targetUserLink: `tg://user?id=${uid}`,
		},
		buttons: [[
			new TGInlineButton('admin_confirmation_yes_cmd', `${OPCODE.WARN_USER}${OPCODE.B64_TO_INT}:${intToBase64(Number(uid))}`),
			new TGInlineButton('admin_confirmation_no_cmd', `${OPCODE.CHANGE_VIEW}${OPCODE.B64_TO_INT}${OPCODE.SHIFT_ARGS}${OPCODE.WARN_CANCEL}${OPCODE.B64_TO_INT}:${intToBase64(Number(uid))}:${intToBase64(dashboardId)}`),
		]],
	};
};
