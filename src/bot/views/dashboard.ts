import type { View, ViewArgs } from '.';
import abAvailable, { Flags } from '../../ab';
import { intToBase64 } from '../../helpers';
import { TGInlineButton } from '../markup';
import { OPCODE } from '../opcodes';
import { id as banViewId } from './ban';
import { id as muteViewId } from './mute';
import { id as warnViewId } from './warn';
import { id as debugMenuViewId } from './debug-menu';

export const id = 0x00;

function changeView(viewId: number) {
	return `${OPCODE.CHANGE_VIEW}${OPCODE.B64_TO_INT}:${intToBase64(viewId)}`;
}

export default async ({ adminId }: Pick<ViewArgs, 'adminId'>): Promise<View> => {
	const buttons = [
		[
			new TGInlineButton('admin_ban_cmd', changeView(banViewId)),
		],
		[
			new TGInlineButton('admin_mute_cmd', changeView(muteViewId)),
		],
	];
	const [ warningsAB, debugMenuAB ] = await Promise.all([
		abAvailable(Flags.warnings, adminId),
		abAvailable(Flags.debugMenu, adminId),
	]);
	if (warningsAB) {
		buttons.push([new TGInlineButton('admin_warn_cmd', changeView(warnViewId))]);
	}
	if (debugMenuAB) {
		buttons.push([new TGInlineButton('admin_debug_cmd', changeView(debugMenuViewId))]);
	}
	return {
		text: 'admin_dashboard',
		buttons,
	};
};
