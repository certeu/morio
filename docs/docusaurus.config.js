// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config
import { themes as prismThemes } from 'prism-react-renderer'
import smartyPants from 'remark-smartypants'

/** @type {import('@docusaurus/types').Config} */
const config = {
  // Metadata
  title: 'Morio',
  tagline: 'Plumbing for your observability needs',
  favicon: 'img/favicon.svg',
  url: 'https://morio.it',
  baseUrl: '/',

  // Github pages
  organizationName: 'certeu',
  projectName: 'morio',

  // How to handle broken links
  //onBrokenLinks: 'throw',
  //onBrokenMarkdownLinks: 'warn',

  // Blog
  //onInlineAuthors: 'throw',
  //onUntruncatedBlogPost: 'throw',
  // i18n
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          remarkPlugins: [smartyPants],
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/certeu/morio/tree/develop/docs/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/certeu/morio/tree/develop/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
    // Redocusaurus config
    [
      'redocusaurus',
      {
        // Plugin Options for loading OpenAPI files
        specs: [
          // Management API docs from OpenAPI spec
          {
            spec: './static/oas-api.yaml',
            route: '/oas-api/',
          },
          // Core API docs from OpenAPI spec
          {
            spec: './static/oas-core.yaml',
            route: '/oas-core/',
          },
        ],
        // Theme Options for modifying how redoc renders them
        theme: {
          // Change with your site colors
          primaryColor: '#1890ff',
        },
      },
    ],
  ],

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/morio-social-card.jpg',
      announcementBar: {
        content:
          '<b>Warning</b>: Morio is not yet ready for production | <a href="/blog/2024/06/26/oven-window">Learn more</a>',
        isCloseable: false,
        backgroundColor: '#EB6534',
        textColor: '#fff',
      },
      navbar: {
        title: 'Morio',
        logo: {
          alt: 'Morio Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'guides/readme',
            position: 'left',
            label: 'Guides',
          },
          {
            type: 'doc',
            docId: 'reference/readme',
            position: 'left',
            label: 'Reference',
          },
          { to: '/blog', label: 'Blog', position: 'left' },
          {
            href: 'https://github.com/certeu/morio',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        links: [],
        copyright: `
        <div id="tagline">
        <a href="/"><b>Morio</b></a>
        <br />
        <span>Connect | Stream | Observe | Respond</span>
        By <a href="https://cert.europa.eu/" target="_BLANK" rel="nofollow">CERT-EU</a>
        </div>`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['yaml'],
      },
    }),
}

export default config
