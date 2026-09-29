import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const isProduction = process.env.NODE_ENV === 'production';

const config: Config = {
  title: 'MAGPIE',
  tagline: 'A framework for developers and AI agents',
  favicon: 'img/magpie.png',

  future: {
    v4: true,
  },

  url: 'https://luxai-qtrobot.github.io',
  baseUrl: '/magpie-doc/',
  organizationName: 'luxai-qtrobot',
  projectName: 'magpie-doc',
  trailingSlash: false,
  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  markdown: {
    mermaid: true,
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          editUrl:
            'https://github.com/luxai-qtrobot/magpie-doc/edit/main/',
          showLastUpdateAuthor: false,
          // Docusaurus uses a simulated 2018 date during development. Show
          // update metadata only when the production build can read Git history.
          showLastUpdateTime: isProduction,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.6,
          ignorePatterns: ['/tags/**'],
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        indexDocs: true,
        indexBlog: false,
        indexPages: true,
        docsRouteBasePath: '/docs',
        hashed: true,
        highlightSearchTermsOnTargetPage: true,
        searchBarShortcut: true,
        searchBarShortcutHint: true,
      },
    ],
  ],

  themeConfig: {
    metadata: [
      {
        name: 'keywords',
        content:
          'MAGPIE, robotics, AI agents, messaging, RPC, MQTT, ZeroMQ, WebRTC, MCP, Python, C++, TypeScript',
      },
    ],
    image: 'img/magpie-social-card.svg',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    mermaid: {
      theme: {light: 'base', dark: 'dark'},
      options: {
        themeVariables: {
          primaryColor: '#dff7f0',
          primaryTextColor: '#102129',
          primaryBorderColor: '#118e78',
          secondaryColor: '#e9edff',
          secondaryTextColor: '#102129',
          secondaryBorderColor: '#667eea',
          tertiaryColor: '#f2f7f6',
          tertiaryTextColor: '#102129',
          tertiaryBorderColor: '#8fa7a2',
          lineColor: '#118e78',
          textColor: '#17242a',
          mainBkg: '#dff7f0',
          nodeBorder: '#118e78',
          clusterBkg: '#f2f7f6',
          clusterBorder: '#a9c6c0',
          edgeLabelBackground: '#f7faf9',
          fontFamily: 'Manrope, system-ui, sans-serif',
        },
      },
    },
    navbar: {
      title: 'MAGPIE',
      hideOnScroll: true,
      logo: {
        alt: 'MAGPIE',
        src: 'img/magpie.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/docs/concepts/philosophy',
          label: 'Concepts',
          position: 'left',
        },
        {
          to: '/docs/examples',
          label: 'Examples',
          position: 'left',
        },
        {
          to: '/docs/reference',
          label: 'API',
          position: 'left',
        },
        {
          type: 'dropdown',
          label: 'Repositories',
          position: 'right',
          items: [
            {
              label: 'Python',
              href: 'https://github.com/luxai-qtrobot/magpie',
            },
            {
              label: 'C++',
              href: 'https://github.com/luxai-qtrobot/magpie-cpp',
            },
            {
              label: 'TypeScript / JavaScript',
              href: 'https://github.com/luxai-qtrobot/magpie-js',
            },
            {
              label: 'Documentation',
              href: 'https://github.com/luxai-qtrobot/magpie-doc',
            },
          ],
        },
        {
          href: 'https://github.com/luxai-qtrobot/magpie',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'MAGPIE on GitHub',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Learn',
          items: [
            {label: 'Get started', to: '/docs/overview'},
            {label: 'Architecture', to: '/docs/concepts/architecture'},
            {label: 'Examples', to: '/docs/examples'},
          ],
        },
        {
          title: 'Build',
          items: [
            {label: 'Python API', to: '/docs/reference/python'},
            {label: 'C++ API', to: '/docs/reference/cpp'},
            {label: 'TypeScript API', to: '/docs/reference/typescript'},
          ],
        },
        {
          title: 'Project',
          items: [
            {
              label: 'MAGPIE on GitHub',
              href: 'https://github.com/luxai-qtrobot/magpie',
            },
            {
              label: 'Documentation source',
              href: 'https://github.com/luxai-qtrobot/magpie-doc',
            },
            {
              label: 'Documentation issues',
              href: 'https://github.com/luxai-qtrobot/magpie-doc/issues',
            },
            {label: 'Contributing', to: '/docs/contributing'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} LuxAI S.A. MAGPIE is licensed under GPLv3.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'powershell', 'cpp', 'python', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
