import type { View } from '.';
import { intToBase64 } from '../../helpers';
import { TGInlineButton } from '../markup';
import { OPCODE } from '../opcodes';
import { id as dashboardId } from './dashboard';

export const id = 0x0d;

export default (): View => {
	return {
		text: 'admin_debug_view',
		buttons: [
			[
				new TGInlineButton('admin_throw_error_cmd', `${OPCODE.THROW_ERROR}`),
			],
			[
				new TGInlineButton('admin_back_cmd', `${OPCODE.CHANGE_VIEW}${OPCODE.B64_TO_INT}:${intToBase64(dashboardId)}`),
			],
		],
	};
};
