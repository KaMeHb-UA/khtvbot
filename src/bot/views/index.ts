import type { DynamicTranslationArgs, Phrases } from '../../l10n';
import type { TGButton } from '../markup';
import * as dashboard from './dashboard';
import * as ban from './ban';
import * as mute from './mute';
import * as search from './search';
import * as searchPrompt from './search-prompt';
import * as dataProcessing from './data-processing';
import * as banConfirmation from './ban-confirmation';
import * as muteConfirmation from './mute-confirmation';
import * as warnConfirmation from './warn-confirmation';
import * as warnCountExceeded from './warn-count-exceeded';
import * as warnAlreadyProcessing from './warn-already-processing';
import * as warn from './warn';
import * as warnRecent from './warn-recent';

const viewList = [
	dashboard,
	ban,
	mute,
	search,
	searchPrompt,
	dataProcessing,
	banConfirmation,
	muteConfirmation,
	warnConfirmation,
	warnCountExceeded,
	warnAlreadyProcessing,
	warn,
	warnRecent,
];

type AdminPhrases<T extends string> = T extends `admin_${infer _}` ? T : never;

export type View = {
	text: AdminPhrases<keyof Phrases>;
	textTranslationArgs?: DynamicTranslationArgs;
	buttons: TGButton[][];
};

export type ViewArgs = {
	adminId: number;
	groupId: number;
	searchText?: string;
	opcodeSequence?: string;
	initialArgs?: string[];
};

const views: {
	[x in typeof viewList[number]['id']]: Extract<typeof viewList[number], { id: x }>['default'];
} = {} as any;

viewList.forEach(({ id, default: view }) => views[id] = view as any);

export default views;
