import DB from './db';

export enum Flags {
	warnings = 'warnings',
}

export default async function abAvailable(flag: Flags, uid: number) {
	const remoteFlags = await DB.getABFlags();
	if (!Object.keys(remoteFlags).includes(flag)) return true;
	return remoteFlags[flag].includes(uid);
}
