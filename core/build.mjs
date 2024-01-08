import { build, banner } from './shared/build.mjs'
import pkg from './package.json' assert { type: 'json' }

/*
 * This builds our code into a self-contained file with esbuild
 */
build(pkg, {
  /*
   * The CJS/ESM wars can make even a veteran JS developer fall apart.
   * If you don't understand these lines below, ignorance is bliss :)
   */
  banner: {
    js: [
      banner(pkg),
      `import { createRequire as topLevelCreateRequire } from 'module'`,
      `const require = topLevelCreateRequire(import.meta.url)`,
      `const __filename = (await import('node:url')).fileURLToPath(import.meta.url)`,
      `const __dirname = (await import('node:path')).dirname(__filename)`,
    ].join('\n'),
  },

  /*
   * These dependencies cannot be bundled because of native bindings.
   * We need to be instal them inside the container image or things will break.
   */
  external: ['cpu-features', 'ssh2'],
})
