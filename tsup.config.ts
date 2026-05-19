import { defineConfig } from 'tsup';
import { globSync } from 'glob';

const DIR_SRC = 'src/main/resources';
const DIR_DST = 'build/resources/main';

const entries = Object.fromEntries(
    globSync(`${DIR_SRC}/**/*.ts`, { posix: true })
        .filter(file => !file.endsWith('.d.ts'))
        .map(file => [
            file.replace(`${DIR_SRC}/`, '').replace(/\.ts$/, ''),
            file,
        ])
);

export default defineConfig({
    entry: entries,
    outDir: DIR_DST,
    format: 'cjs',
    target: 'es5',
    platform: 'neutral',
    bundle: true,
    splitting: false,
    sourcemap: false,
    minify: false,
    dts: false,
    clean: false,
    external: [
        /^\/lib\/xp\//,
        '/lib/thymeleaf',
    ],
    esbuildOptions(options) {
        options.mainFields = ['module', 'main'];
    },
    tsconfig: `${DIR_SRC}/tsconfig.json`,
});
