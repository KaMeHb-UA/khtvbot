import DB from './db';

export enum Flags {
	warnings = 'warnings',
	debugMenu = 'debug-menu',
}

export default async function abAvailable(flag: Flags, uid: number) {
	const remoteFlagsUsers = await DB.getABFlag(flag);
	if (!remoteFlagsUsers) return true;
	return remoteFlagsUsers.includes(uid);
}
