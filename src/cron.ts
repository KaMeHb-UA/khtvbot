import type { Environment } from './platform';

type ProcessResult = void | Promise<void | { waitUntil: Promise<void> }>;

const cronTasks: [trigger: string, processor: (env: Environment) => ProcessResult][] = [
];

export default async (trigger: string, env: Environment) => {
	const processes: ProcessResult[] = [];
	for (const [taskTrigger, processor] of cronTasks) {
		if (taskTrigger !== trigger) continue;
		try {
			processes.push(processor(env));
		} catch(e) {
			processes.push(Promise.reject(e));
		}
	}
	const waitUntil: (void | Promise<void>)[] = [];
	for (const result of await Promise.all(processes)) {
		if (!result) continue;
		waitUntil.push(result.waitUntil);
	}
	return {
		waitUntil: Promise.all(waitUntil).then(() => {}),
	};
}
