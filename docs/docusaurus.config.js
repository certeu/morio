// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config
import {themes as prismThemes} from 'prism-react-renderer';

const arrow = `<svg role="img" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width='12" height="12" stroke-width="2" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"></path></svg>`

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
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

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
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/certeu/morio/tree/develop/docs/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/certeu/morio/tree/develop/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  markdown: {
    mermaid: true,
  },
  themes: [
    '@docusaurus/theme-mermaid',
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/docusaurus-social-card.jpg',
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
            label: 'Guides'
          },
          {
            type: 'doc',
            docId: 'reference/readme',
            position: 'left',
            label: 'Reference'
          },
          {to: '/blog', label: 'Blog', position: 'left'},
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
      },
    }),
};

export default config;
