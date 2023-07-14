import yaml from 'js-yaml';
import uk from './uk.yml';

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
};

export default function translate<L extends keyof typeof languages, P extends keyof Phrases>(language: L, phrase: P, variables: Phrases[P]) {
	let text: string = languages[language]?.[phrase]?.trim?.() || `Can't find phrase "${phrase}" in ${language} language. Please ensure that language & phrase are correct and linked to translation plugin`;
	for (const [name, value] of Object.entries(variables)) {
		text = text.replaceAll('${' + name + '}', String(value));
	}
	return text;
}
