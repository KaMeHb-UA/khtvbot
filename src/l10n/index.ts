import yaml from 'js-yaml';
import uk from './uk.yml';
import type { View } from '../bot/views';

const languages = {
	uk: yaml.load(uk) as Record<string, string>,
};

export type Phrases = {
	welcome: {
		userLink: string;
		userName: string;
		groupName: string;
		groupRulesLink: string;
	};
	admin_dashboard: {
		userName: string;
		groupLink: string;
		groupName: string;
	};
	admin_ban_cmd: Record<string, never>;
	admin_mute_cmd: Record<string, never>;
	admin_back_cmd: Record<string, never>;
	admin_ban_view: Record<string, never>;
	admin_mute_view: Record<string, never>;
	admin_ban_success: Record<string, never>;
	admin_mute_success: Record<string, never>;
	user_ban_message: {
		userLink: string;
		userFullNameWithNick: string;
	};
	user_mute_message: {
		userLink: string;
		userName: string;
	};
	admin_user_search_message: Record<string, never>;
	admin_data_processing_message: Record<string, never>;
	admin_user_list: Record<string, never>;
	admin_search_cmd: Record<string, never>;
};

type UnionToIntersection<U> =(U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

type TranslationArgs = UnionToIntersection<Exclude<{ [x in View['text']]: Phrases[x] }[View['text']], Record<string, never>>>;

type Optional<T extends Record<string, any>> = {
	[x in keyof T]?: T[x];
};

type DynamicTranslationArgsNames<T = keyof TranslationArgs> = T extends `target${infer A}` ? `target${A}` : never;

export type StaticTranslationArgs = Omit<TranslationArgs, DynamicTranslationArgsNames>;

export type DynamicTranslationArgs = Optional<Pick<TranslationArgs, DynamicTranslationArgsNames>>;

export default function translate<L extends keyof typeof languages, P extends keyof Phrases>(language: L, phrase: P, variables: Phrases[P]) {
	let text: string = languages[language]?.[phrase]?.trim?.() || `Can't find phrase "${phrase}" in ${language} language. Please ensure that language & phrase are correct and linked to translation plugin`;
	for (const [name, value] of Object.entries(variables)) {
		text = text.replaceAll('${' + name + '}', String(value));
	}
	return text;
}
