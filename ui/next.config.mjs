/*
 * The configuration file for NextJS frontend framework
 * See: https://nextjs.org/
 */

/*
 * NodeJS path is used to resolve local path to full path
 */
import path from 'path'

/*
 * The NextJS configuration
 */
const nextConfig = {
  pageExtensions: ['mjs'],
  reactStrictMode: true,
  output: 'standalone',
  webpack: (config, options) => {
    /*
     * Webpack aliases to simplify import paths
     */
    config.resolve.alias.components = path.resolve(`./components`)
    config.resolve.alias.config = path.resolve(`./config`)
    config.resolve.alias.context = path.resolve(`./context`)
    config.resolve.alias.hooks = path.resolve(`./hooks`)
    config.resolve.alias.lib = path.resolve(`./lib`)
    config.resolve.alias.pages = path.resolve(`./pages`)
    config.resolve.alias.ui = path.resolve('./')

    /*
     * Add support for YAML imports
     */
    config.module.rules.push({
      test: /\.ya?ml$/,
      use: 'yaml-loader',
    })

    /*
     * We need to return the webpack config here
     */
    return config
  },
}

export default nextConfig