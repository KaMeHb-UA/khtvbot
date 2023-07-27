import type { View } from '.';
import { intToBase64 } from '../../helpers';
import { TGInlineButton } from '../markup';
import { OPCODE } from '../opcodes';
import { id as banViewId } from './ban';
import { id as muteViewId } from './mute';
import { id as warnViewId } from './warn';

export const id = 0x00;

export default (): View => ({
	text: 'admin_dashboard',
	buttons: [
		[
			new TGInlineButton('admin_ban_cmd', `${OPCODE.CHANGE_VIEW}${OPCODE.B64_TO_INT}:${intToBase64(banViewId)}`),
		],
		[
			new TGInlineButton('admin_mute_cmd', `${OPCODE.CHANGE_VIEW}${OPCODE.B64_TO_INT}:${intToBase64(muteViewId)}`),
		],
		[
			new TGInlineButton('admin_warn_cmd', `${OPCODE.CHANGE_VIEW}${OPCODE.B64_TO_INT}:${intToBase64(warnViewId)}`),
		],
	],
});
