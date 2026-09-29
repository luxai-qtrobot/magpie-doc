import React, {useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Heading from '@theme/Heading';
import styles from './index.module.css';

type Language = 'python' | 'cpp' | 'typescript';

const installs: Record<Language, {label: string; command: string; note: string}> = {
  python: {
    label: 'Python',
    command: 'pip install luxai-magpie',
    note: 'Python 3.9+ · ZeroMQ included',
  },
  cpp: {
    label: 'C++',
    command: 'sudo apt install ./libmagpie_*.deb',
    note: 'C++14 · Debian and Ubuntu packages',
  },
  typescript: {
    label: 'TypeScript',
    command: 'npm install @luxai-qtrobot/magpie',
    note: 'Browser and Node.js',
  },
};

const features = [
  {
    eyebrow: 'ONE API',
    title: 'Transport agnostic',
    body: 'Keep application code stable while moving between ZeroMQ, MQTT, WebRTC, or your own transport.',
  },
  {
    eyebrow: 'ONE WIRE FORMAT',
    title: 'Language interoperable',
    body: 'Python, C++, and TypeScript nodes exchange the same frames, RPC envelopes, schemas, and MCP calls.',
  },
  {
    eyebrow: 'AGENT READY',
    title: 'AI native',
    body: 'Expose real services as MCP tools without creating a separate gateway or changing the service topology.',
  },
  {
    eyebrow: 'USE ONLY WHAT YOU NEED',
    title: 'Lightweight and modular',
    body: 'Start with a small core, then opt into MQTT, WebRTC, media, discovery, and agent integrations.',
  },
  {
    eyebrow: 'MAKE IT YOURS',
    title: 'Customize and extend',
    body: 'Add serializers, transports, frame types, schemas, and tools while keeping the same small application API.',
  },
];

function InstallPanel() {
  const [language, setLanguage] = useState<Language>('python');
  const selected = installs[language];

  return (
    <div className={styles.installPanel}>
      <div className={styles.terminalBar}>
        <span />
        <span />
        <span />
        <span className={styles.terminalTitle}>install magpie</span>
      </div>
      <div className={styles.languageTabs} role="tablist" aria-label="Choose a language">
        {(Object.keys(installs) as Language[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={language === key}
            className={clsx(styles.languageTab, language === key && styles.languageTabActive)}
            onClick={() => setLanguage(key)}>
            {installs[key].label}
          </button>
        ))}
      </div>
      <div className={styles.commandLine}>
        <span aria-hidden="true">$</span>
        <code>{selected.command}</code>
      </div>
      <p>{selected.note}</p>
    </div>
  );
}

function ArchitectureFlow() {
  return (
    <div className={styles.flow} aria-label="MAGPIE architecture overview">
      <div className={styles.flowColumn}>
        <span className={styles.flowLabel}>Intelligence</span>
        <div className={styles.flowNode}>AI agent</div>
        <div className={styles.flowNode}>Cloud service</div>
        <div className={styles.flowNode}>Application</div>
      </div>
      <div className={styles.flowArrow} aria-hidden="true">⇄</div>
      <div className={clsx(styles.flowColumn, styles.flowCore)}>
        <span className={styles.flowLabel}>Stable application API</span>
        <div className={styles.flowBrand}>MAGPIE</div>
        <div className={styles.flowPrimitives}>
          <span>Stream</span><span>RPC</span><span>Frames</span><span>MCP</span>
        </div>
      </div>
      <div className={styles.flowArrow} aria-hidden="true">⇄</div>
      <div className={styles.flowColumn}>
        <span className={styles.flowLabel}>Sensing and action</span>
        <div className={styles.flowNode}>Robot</div>
        <div className={styles.flowNode}>Edge device</div>
        <div className={styles.flowNode}>Browser</div>
      </div>
      <div className={styles.transportRail}>
        <span>ZeroMQ</span><span>MQTT</span><span>WebRTC</span><span>Custom</span>
      </div>
    </div>
  );
}

export default function Home(): React.ReactElement {
  const logo = useBaseUrl('/img/magpie.png');

  return (
    <Layout
      title="A framework for developers and AI agents"
      description="Transport-agnostic streaming and RPC for robots, edge devices, services, browsers, and AI agents.">
      <main>
        <header className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={clsx('container', styles.heroInner)}>
            <div className={styles.heroCopy}>
              <div className={styles.kicker}>MESSAGE ABSTRACTION &amp; GENERAL-PURPOSE INTEGRATION ENGINE</div>
              <Heading as="h1">
                Intelligence anywhere.<br />
                <span>Sensing and action everywhere.</span>
              </Heading>
              <p className={styles.heroLead}>
                MAGPIE lets developers separate where intelligence runs from where sensing and action happen.
              </p>
              <p className={styles.heroSupport}>
                Build transport-independent streaming and RPC systems for developers and AI agents—in Python,
                C++, and TypeScript.
              </p>
              <div className={styles.heroActions}>
                <Link className="button button--primary button--lg" to="/docs/overview">
                  Start building
                </Link>
                <Link className="button button--secondary button--lg" to="/docs/concepts/architecture">
                  Explore the architecture
                </Link>
              </div>
              <div className={styles.signalRow} aria-label="Supported transports">
                <span>ZeroMQ</span><span>MQTT</span><span>WebRTC</span><span>MCP</span>
              </div>
            </div>
            <div className={styles.heroVisual}>
              <div className={styles.logoOrbit}>
                <div className={styles.orbitOne} />
                <div className={styles.orbitTwo} />
                <img src={logo} alt="MAGPIE" />
              </div>
              <InstallPanel />
            </div>
          </div>
        </header>

        <section className={styles.promiseSection}>
          <div className="container">
            <div className={styles.sectionHeading}>
              <span>THE MAGPIE IDEA</span>
              <Heading as="h2">Write the behavior once. Choose the wire later.</Heading>
              <p>
                The same four communication primitives stay familiar across transports and languages. Infrastructure
                choices stop leaking into application logic.
              </p>
            </div>
            <ArchitectureFlow />
          </div>
        </section>

        <section className={styles.featureSection}>
          <div className="container">
            <div className={styles.featureGrid}>
              {features.map((feature, index) => (
                <article className={styles.featureCard} key={feature.title}>
                  <div className={styles.featureNumber}>0{index + 1}</div>
                  <span>{feature.eyebrow}</span>
                  <Heading as="h3">{feature.title}</Heading>
                  <p>{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.languagesSection}>
          <div className="container">
            <div className={styles.sectionHeading}>
              <span>ONE ECOSYSTEM</span>
              <Heading as="h2">Meet every developer where they work.</Heading>
              <p>Mix languages in one system without adding bridge processes or translating message formats.</p>
            </div>
            <div className={styles.languageCards}>
              <Link to="/docs/reference/python" className={styles.languageCard}>
                <strong>Python</strong>
                <span>Complete feature set, CLI toolkit, nodes, discovery, and AI integrations.</span>
                <em>Explore Python →</em>
              </Link>
              <Link to="/docs/reference/cpp" className={styles.languageCard}>
                <strong>C++</strong>
                <span>Native performance for robots, embedded Linux, media, and real-time pipelines.</span>
                <em>Explore C++ →</em>
              </Link>
              <Link to="/docs/reference/typescript" className={styles.languageCard}>
                <strong>TypeScript</strong>
                <span>Typed APIs for Node.js and browser-native MQTT and WebRTC applications.</span>
                <em>Explore TypeScript →</em>
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={clsx('container', styles.ctaInner)}>
            <div>
              <span>FROM FIRST MESSAGE TO AGENT TOOLS</span>
              <Heading as="h2">Build the connection, not the plumbing.</Heading>
            </div>
            <div className={styles.ctaActions}>
              <Link className="button button--primary button--lg" to="/docs/start/quickstart">
                Run the quickstart
              </Link>
              <Link className="button button--secondary button--lg" to="/docs/ai/mcp">
                Connect an AI agent
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
