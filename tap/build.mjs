import esbuild from 'esbuild'

/*
 * This builds our code into a self-contained file with esbuild
 */
async function build() {
  await esbuild
    .build({
      /*
       * The CJS/ESM wars can make even a veteran JS developer fall apart.
       * If you don't understand these lines below, ignorance is bliss :)
       */
      banner: {
        js: [
          `import { createRequire as topLevelCreateRequire } from 'module'`,
          `const require = topLevelCreateRequire(import.meta.url)`,
          `const __filename = (await import('node:url')).fileURLToPath(import.meta.url)`,
          `const __dirname = (await import('node:path')).dirname(__filename)`,
        ].join('\n'),
      },
      bundle: true,
      entryPoints: ['src/index.mjs'],
      format: 'esm',
      metafile: false,
      outfile: 'dist/index.mjs',
      external: [],
      metafile: false,
      minify: true,
      sourcemap: false,
      target: ['node20'],
      platform: 'node',
    })
    .catch(() => process.exit(1)) /* eslint-disable-line no-undef */
}

build()
