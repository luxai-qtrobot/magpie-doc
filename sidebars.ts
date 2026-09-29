import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'overview',
    {
      type: 'category',
      label: 'Start here',
      collapsed: false,
      items: [
        'start/choose-language',
        'start/installation',
        'start/quickstart',
      ],
    },
    {
      type: 'category',
      label: 'Foundations',
      collapsed: false,
      items: [
        'concepts/philosophy',
        'concepts/architecture',
        'concepts/core-api',
        'concepts/interoperability',
        'concepts/dependencies',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/streaming',
        'guides/rpc',
        'guides/schema-rpc',
        'guides/frames',
        'guides/nodes-discovery',
      ],
    },
    {
      type: 'category',
      label: 'Transports',
      items: [
        'transports/overview',
        'transports/zeromq',
        'transports/mqtt',
        'transports/webrtc',
      ],
    },
    {
      type: 'category',
      label: 'AI and tools',
      items: [
        'ai/mcp',
        'tools/cli',
        'tools/ssh-mqtt',
      ],
    },
    {
      type: 'category',
      label: 'Examples',
      items: ['examples/index', 'examples/cross-language'],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/index',
        'reference/python',
        'reference/cpp',
        'reference/typescript',
        'reference/compatibility',
      ],
    },
    {
      type: 'category',
      label: 'Operate and extend',
      items: [
        'operations/security',
        'operations/troubleshooting',
        'extending',
        'contributing',
      ],
    },
  ],
};

export default sidebars;
