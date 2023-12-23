import { build } from './shared/build.mjs'
import pkg from './package.json' assert { type: 'json' }

/*
 * This build the package with esbuild
 * We need to keep some CJS stuff out because
 */
build(pkg, {
  external: ['express', 'joi', 'pino'],
})
