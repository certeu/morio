/*
 * The configuration file for NextJS frontend framework
 * See: https://nextjs.org/
 */

/*
 * Are we running in development, or is this a production
 * build requiring a static export?
 */
const EXPORT = process.env.STATIC_EXORT

/*
 * NodeJS path is used to resolve local path to full path
 */
import path from 'path'

/*
 * MDX support in NextJS
 */
import createMDX from '@next/mdx'

/*
 * Remark plugins from the ecosystem
 */
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkCopyLinkedFiles from 'remark-copy-linked-files'
import remarkSmartypants from 'remark-smartypants'
/*
 * Recma plugin to ensure we can detect MDX components
 * because we render the differently in _app
 */
import recmaIsMDXComponent from 'recma-mdx-is-mdx-component'
import recmaStaticProps from 'recma-nextjs-static-props'
import recmaFilePath from 'recma-export-filepath'

/*
 * The NextJS configuration
 */
const nextConfig = {
  pageExtensions: ['mjs', 'mdx'],
  reactStrictMode: true,
  output: 'standalone',
  trailingSlash: true,
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
    config.resolve.alias.mdx = path.resolve('./mdx')
    config.resolve.alias.prebuild = path.resolve(`./prebuild`)

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

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm, remarkSmartypants],
    rehypePlugins: [],
    recmaPlugins: [recmaIsMDXComponent, recmaFilePath, recmaStaticProps],
  },
})

export default withMDX(nextConfig)
