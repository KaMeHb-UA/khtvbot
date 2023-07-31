import { build } from 'esbuild';
import { exit } from 'node:process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = resolve(fileURLToPath(import.meta.url), '..'),
	distFile = resolve(dirname, 'dist/index.js');

/** @type {import('esbuild').Plugin} */
const stubNodeModulesPlugin = {
	name: 'stub',
	setup(build) {
		build.onResolve({ filter: /^(fs|path)$/ }, args => ({
			path: args.path,
			namespace: 'stub-ns',
		}));
		build.onLoad({ filter: /.*/, namespace: 'stub-ns' }, () => ({
			contents: 'export{}',
			loader: 'ts',
		}));
	},
}

/** @type {import('esbuild').BuildOptions} */
const buildConfig = {
	entryPoints: [
		resolve(dirname, 'src/index.js'),
	],
	bundle: true,
	outfile: distFile,
	sourcemap: 'external',
	allowOverwrite: true,
	minify: true,
	minifyIdentifiers: true,
	minifySyntax: true,
	minifyWhitespace: true,
	platform: 'neutral',
	format: 'esm',
	tsconfig: 'tsconfig.json',
	metafile: false,
	plugins: [stubNodeModulesPlugin],
	legalComments: 'none',
	loader: {
		'.yml': 'copy',
	},
	external: [
		'./index.js.map',
	],
	mainFields: ['browser', 'module', 'main'],
};

try {
	await build(buildConfig);
} catch(e) {
	exit(1);
}
