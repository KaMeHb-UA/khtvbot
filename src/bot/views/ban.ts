import type { View } from '.';
import { intToBase64 } from '../../helpers';
import { TGInlineButton } from '../markup';
import { OPCODE } from '../opcodes';
import { id as dashboardId } from './dashboard';

export const id = 0x01;

export default (): View => ({
	text: 'admin_ban_view',
	buttons: [
		[
			new TGInlineButton('admin_back_cmd', `${OPCODE.CHANGE_VIEW}${OPCODE.B64_TO_INT}:${intToBase64(dashboardId)}`),
		],
	],
});
