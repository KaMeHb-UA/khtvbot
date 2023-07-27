import DB from './db';

export enum Flags {
	warnings = 'warnings',
}

let remoteFlagCache: Promise<Awaited<ReturnType<typeof DB['getABFlags']>>> | undefined;

async function getRemoteFlags() {
	if (!remoteFlagCache) {
		remoteFlagCache = DB.getABFlags();
	}
	return remoteFlagCache;
}

export default async function abAvailable(flag: Flags, uid: number) {
	const remoteFlags = await getRemoteFlags();
	if (!Object.keys(remoteFlags).includes(flag)) return true;
	return remoteFlags[flag].includes(uid);
}
