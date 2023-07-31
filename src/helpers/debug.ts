import { OPCODE, type Runners } from '../bot/opcodes';

type OpcodeIndex = keyof typeof OPCODE;

const reverseEnum: Record<OPCODE, OpcodeIndex> = {} as any;

for (const opcodeName of Object.keys(OPCODE) as OpcodeIndex[]) {
	reverseEnum[OPCODE[opcodeName]] = opcodeName;
}

export function fixOpcodeFunctionsNames(runners: Runners) {
	for (const opcode of Object.keys(runners) as OPCODE[]) {
		Object.defineProperty(runners[opcode], 'name', {
			value: `[OPCODE.${reverseEnum[opcode]}]`,
		});
	}
	return runners;
}
