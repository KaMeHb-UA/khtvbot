export enum OPCODE {
	CHANGE_VIEW = '0',
	BAN_USER = '1',
//	MUTE_USER = '2',
//	SEARCH_USER = '3',
	INT_TO_B64 = '4',
	B64_TO_INT = '5',
}

type MaybePromise<T> = T | PromiseLike<T>;

type Runners = {
	[x in OPCODE]: (previousResult: any, restSequence: string, initialArgs: string[]) => MaybePromise<{
		result: any;
		returnImmidiately: boolean;
	}>;
};

export async function runString(input: string, runners: Runners) {
	console.log(`RUNNING OPCODED STRING: ${input}`);
	const [ops, args, ...initialArgs] = input.split(':');
	let runResult = args;
	for (let i = ops.length - 1; i >= 0; i--) {
		const { result, returnImmidiately } = await runners[ops[i] as OPCODE](runResult, ops.slice(0, i), initialArgs);
		if (returnImmidiately) return;
		runResult = result;
	}
}
