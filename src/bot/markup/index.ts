import _, { type Phrases } from '../../l10n';

export abstract class TGButton {
	constructor(public text: string) {}
}

type AdminCommandOnly<T extends string> = T extends `admin_${infer _}_cmd` ? T : never;

export class TGInlineButton extends TGButton {
	constructor(text: AdminCommandOnly<keyof Phrases>, callback_data: string, translate?: true);
	constructor(text: string, callback_data: string, translate: false);
	constructor(text: string, public callback_data: string, translate: boolean = true) {
		super(translate ? _('uk', text as AdminCommandOnly<keyof Phrases>, {}) : text);
	}
}
