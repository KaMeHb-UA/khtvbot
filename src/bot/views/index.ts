import type { Phrases } from '../../l10n';
import type { TGButton } from '../markup';
import * as dashboard from './dashboard';
import * as ban from './ban';
import * as mute from './mute';

const viewList = [
	dashboard,
	ban,
	mute,
];

type AdminPhrases<T extends string> = T extends `admin_${infer _}` ? T : never;

export type View = {
	text: AdminPhrases<keyof Phrases>;
	buttons: TGButton[][];
}

const views: {
	[x in typeof viewList[number]['id']]: Extract<typeof viewList[number], { id: x }>['default'];
} = {} as any;

viewList.forEach(({ id, default: view }) => views[id] = view as any);

export default views;
