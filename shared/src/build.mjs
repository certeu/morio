import esBuild from 'esbuild'
import { getPreset } from '#config'

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
export function banner(pkg) {
  return  `/**
 * ${pkg.name} | v${pkg.version}
 * ${pkg.description}
 * (c) ${new Date().getFullYear()} European Commission
 * @license ${pkg.license}
 *
 * Licensed under the EUPL, Version 1.2 or -- as soon they will be approved by
 * the European Commission -- subsequent versions of the EUPL (the "Licence");
 * You may not use this work except in compliance with the Licence.
 * You may obtain a copy of the Licence at:
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12/
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" basis, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * Licence for the specific language governing permissions and limitations
 * under the Licence.
 */`
}

/**
 * Returns an options object for Esbuild
 *
 * You can pass it any option to override the defaults.
 *
 * @param {object} pkg - An object that is the package.json import
 * @param {object} customOptions - An object holding Esbuild options to override the defaults
 * @return {string} options - The Esbuild options
 */
export function esbuildOptions(pkg, customOptions = {}) {
  return {
    banner: { js: banner(pkg) },
    bundle: true,
    entryPoints: ['src/index.mjs'],
    format: 'esm',
    outfile: 'dist/index.mjs',
    external: [],
    metafile: getPreset('MORIO_ESBUILD_VERBOSE', { dflt: false, as: 'bool' }),
    // Keep debug simple for now. i
    //minify: getPreset('MORIO_ESBUILD_MINIFY', { dflt: true, as: 'bool' }),
    minify: false,
    platform: 'node',
    target: ['node20'],
    sourcemap: false,
    ...customOptions,
  }
}

/*
 * Helper method to let esbuild generate the build
 *
 * Does not return, instead writes to disk based on the outfile option
 *
 * @param {object} pkg - An object that is the package.json import
 * @param {object} customOptions - An object holding Esbuild options to override the defaults
 */
export async function build(pkg, customOptions = {}) {
  const result = await esbuild
    .build(esbuildOptions(pkg, customOptions))
    .catch(() => process.exit(1)) /* eslint-disable-line no-undef */

  if (getPreset('MORIO_ESBUILD_VERBOSE', { dflt: false, as: 'bool' })) {
    const info = await esbuild.analyzeMetafile(result.metafile)
    console.log(info)
  }
}
