import translate, { type Phrases } from '../../l10n';

export abstract class TGButton {
	constructor(public text: string) {}
}

type AdminCommandOnly<T extends string> = T extends `admin_${infer _}_cmd` ? T : never;

export class TGInlineButton extends TGButton {
	constructor(text: AdminCommandOnly<keyof Phrases>, public callback_data: string) {
		super(translate('uk', text, {}));
	}
}
