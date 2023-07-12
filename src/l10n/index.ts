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
	welcome_admin: {
		userName: string;
		groupLink: string;
		groupName: string;
	};
};

export default function translate<L extends keyof typeof languages, P extends keyof Phrases>(language: L, phrase: P, variables: Phrases[P]) {
	let text: string = languages[language]?.[phrase] || `Can't find phrase "${phrase}" in ${language} language. Please ensure that language & phrase are correct and linked to translation plugin`;
	for (const [name, value] of Object.entries(variables)) {
		text = text.replaceAll('${' + name + '}', String(value));
	}
	return text;
}
