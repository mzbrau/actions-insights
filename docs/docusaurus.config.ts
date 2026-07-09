import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Actions Insights',
  tagline: 'GitHub-native test reports for GitHub Actions',
  favicon: 'logo-white.png',

  url: 'https://www.ghactionsinsights.com',
  baseUrl: '/',

  organizationName: 'mzbrau',
  projectName: 'actions-insights',

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
    mermaid: true,
  },

  themes: ['@docusaurus/theme-mermaid'],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/mzbrau/actions-insights/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/comment.png',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Actions Insights',
      logo: {
        alt: 'Actions Insights',
        src: 'logo-white.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/mzbrau/actions-insights',
          label: 'GitHub',
          position: 'right',
        },
        {
          type: 'doc',
          docId: 'setup/quick-start',
          position: 'right',
          label: 'Get Started',
          className: 'navbar-get-started',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Introduction', to: '/docs/intro'},
            {label: 'Quick Start', to: '/docs/setup/quick-start'},
            {label: 'Configuration', to: '/docs/reference/configuration'},
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/mzbrau/actions-insights',
            },
            {
              label: 'Apache 2.0 License',
              href: 'https://github.com/mzbrau/actions-insights/blob/main/LICENSE',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Actions Insights. Apache 2.0 License.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'yaml'],
    },
    mermaid: {
      theme: {dark: 'dark'},
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
