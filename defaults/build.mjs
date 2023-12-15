import { build } from '@morio/lib/build'
import pkg from './package.json' assert { type: 'json' }

/*
 * This build the package with esbuild
 */
build(pkg)

