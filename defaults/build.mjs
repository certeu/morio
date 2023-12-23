import { build } from '../shared/src/build.mjs'
import pkg from './package.json' assert { type: 'json' }

/*
 * This build the package with esbuild
 */
build(pkg)
