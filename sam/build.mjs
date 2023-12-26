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
   * These are dependencies using .node files which won't work out of the box.
   * We can work around it with a plugin, but this code is a nested dependency that
   * we do not actually use. So let's just drop it.
   * See: https://github.com/evanw/esbuild/issues/1051#issuecomment-806325487
   */
  external: ['cpu-features', 'ssh2'],
})
