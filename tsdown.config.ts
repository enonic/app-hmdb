import {globSync} from 'glob';
import {defineConfig} from 'tsdown';


const SRC = 'src/main/resources';
const SRC_ASSETS = `${SRC}/assets`;
const DST = 'build/resources/main';
const DST_ASSETS = `${DST}/assets`;

const dev = process.env.NODE_ENV === 'development';
const logLevel: 'silent' | 'info' = ['QUIET', 'WARN'].includes(process.env.LOG_LEVEL_FROM_GRADLE || '') ? 'silent' : 'info';

// Enonic XP loads each controller/service/task by its resource path, so every
// source file must become its own output file with the directory tree intact.
// Turn a glob into a tsdown `entry` map ({ "relative/name": "src/path/file.ts" }).
function entries(dir: string, exts: string, ignore: string[] = []): Record<string, string> {
  return Object.fromEntries(
    globSync(`${dir}/**/*.${exts}`, {posix: true, ignore})
      .map(file => [file.slice(dir.length + 1).replace(/\.[^.]+$/, ''), file]),
  );
}

const serverEntry = entries(SRC, '{ts,js}', [`${SRC_ASSETS}/**`]);
const assetEntry = entries(SRC_ASSETS, '{tsx,ts,jsx,js}');

// XP runtime libraries are provided by the platform — never bundle them.
const xpExternal = [
  '/lib/cache',
  '/lib/enonic/asset',
  '/lib/enonic/static',
  /^\/lib\/guillotine/,
  '/lib/graphql',
  '/lib/graphql-connection',
  '/lib/http-client',
  '/lib/license',
  '/lib/mustache',
  '/lib/router',
  '/lib/util',
  '/lib/vanilla',
  '/lib/text-encoding',
  '/lib/thymeleaf',
  /^\/lib\/xp\//,
];

// Skip a target that has no source files (e.g. a server-only or client-only app).
export default defineConfig([
  ...(Object.keys(serverEntry).length ? [{
    entry: serverEntry,
    outDir: DST,
    format: 'cjs' as const,
    target: 'es2015', // Rolldown/oxc floor; runs on XP 8's GraalJS engine
    platform: 'neutral' as const,
    clean: false, // outDir also holds Gradle-copied resources + the assets/ subfolder
    dts: false, // d.ts files are useless at runtime
    minify: false, // minifying server files makes debugging harder
    sourcemap: false,
    logLevel,
    tsconfig: `${SRC}/tsconfig.json`,
    inputOptions: {
      external: xpExternal,
      resolve: {
        mainFields: ['module', 'main'],
      },
    },
    outputOptions: {
      chunkFileNames: '_chunks/[name]-[hash].js', // avoid chunk-name collisions
    },
  }] : []),
  ...(Object.keys(assetEntry).length ? [{
    entry: assetEntry,
    outDir: DST_ASSETS,
    format: 'esm' as const,
    target: 'es2015',
    platform: 'browser' as const,
    clean: false,
    dts: false,
    minify: !dev,
    sourcemap: !dev,
    logLevel,
    tsconfig: `${SRC_ASSETS}/tsconfig.json`,
  }] : []),
]);
