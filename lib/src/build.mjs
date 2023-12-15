import esBuild from 'esbuild'
import { fromEnv } from './env.mjs'

/*
 * Re-export esbuild for easy imports
 */
export const esbuild = esBuild

/**
 * Create banner based on package info
 *
 * @param {object} pkg - An object that is the package.json import
 * @return {string} banner - The banner
 */
export const banner = (pkg) => `/**
 * ${pkg.name} | v${pkg.version}
 * ${pkg.description}
 * (c) ${new Date().getFullYear()} ${pkg.author}
 * @license ${pkg.license}
 */`

/**
 * Returns an options object for Esbuild
 *
 * You can pass it any option to override the defaults.
 *
 * @param {object} pkg - An object that is the package.json import
 * @param {object} customOptions - An object holding Esbuild options to override the defaults
 * @return {string} options - The Esbuild options
 */
export const esbuildOptions = (pkg, customOptions={}) => ({
  banner: { js: banner(pkg) },
  bundle: true,
  entryPoints: ['src/index.mjs'],
  format: 'esm',
  outfile: 'dist/index.mjs',
  external: [],
  metafile: fromEnv('MORIO_BUILD_VERBOSE', 'bool'),
  minify: fromEnv('MORIO_BUILD_MINIFY', 'bool'),
  sourcemap: true,
  ...customOptions,
})

/*
 * Helper method to let esbuild generate the build
 *
 * Does not return, instead writes to disk based on the outfile option
 *
 * @param {object} pkg - An object that is the package.json import
 * @param {object} customOptions - An object holding Esbuild options to override the defaults
 */
export const build = async (pkg, customOptions) => {
  const result = await esbuild.build(esbuildOptions(pkg, customOptions)).catch(() => process.exit(1))

  if (fromEnv('MORIO_BUILD_VERBOSE')) {
    const info = await esbuild.analyzeMetafile(result.metafile)
    console.log(info)
  }
}

