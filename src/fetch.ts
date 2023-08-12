type MaybePromise<T> = T | PromiseLike<T>;

type Processor<T = any> = (response: Response) => MaybePromise<{ response: T } | { error: Error; retry: boolean }>;

const maxBackoff = 5_000;
const defaultMaxAttempts = 5;

function sleep(ms: number) {
	return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

const defaultProcessor: Processor<Response> = function defaultProcessor(response: Response) {
	if (!response.ok) return {
		error: new Error(`HTTP Error ${response.status}: ${response.statusText}`),
		retry: response.status === 429 || response.status >= 500,
	};
	return {
		response,
	};
}

function defaultBackoff(attempt: number) {
	return Math.min(2 ** attempt + Math.random() * 1000, maxBackoff);
}

export const fetchFactory = Object.assign(
	function fetchFactory<T = any>(
		processor: Processor<T> = defaultProcessor as any,
		calculateBackoff: (attempt: number) => number = defaultBackoff,
		maxAttempts: number = defaultMaxAttempts,
	) {
		return async (input: RequestInfo, init?: RequestInit) => {
			let attempt = 0;
			while (true) {
				const response = await fetch(input, init);
				const data = await processor(response);
				if ('error' in data) {
					if (!data.retry || attempt === maxAttempts) throw data.error;
				} else {
					return data.response;
				}
				await sleep(calculateBackoff(attempt++));
			}
		};
	},
	{
		defaultProcessor,
		defaultBackoff,
	},
);

export default fetchFactory<Response>();
