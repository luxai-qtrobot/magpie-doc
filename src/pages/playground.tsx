import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Playground from '../components/Playground';
import styles from './playground.module.css';

export default function PlaygroundPage(): React.ReactElement {
  return (
    <Layout
      title="Playground"
      description="Run MAGPIE streaming and RPC examples directly in your browser over WebRTC.">
      <main className={styles.page}>
        <section className={styles.intro}>
          <div className="container">
            <div className={styles.eyebrow}>LIVE MAGPIE PLAYGROUND</div>
            <Heading as="h1">Make two nodes meet.</Heading>
            <p>
              Edit and run real MAGPIE code in your browser. Pair it with another browser tab or a Python node,
              then watch streaming and RPC cross the wire live.
            </p>
            <div className={styles.capabilities} aria-label="Playground capabilities">
              <span>Browser-native</span>
              <span>WebRTC</span>
              <span>Python interoperable</span>
              <span>Temporary TURN access</span>
            </div>
          </div>
        </section>

        <section className={styles.workspaceSection}>
          <div className="container">
            <BrowserOnly fallback={<PlaygroundSkeleton />}>
              {() => <Playground />}
            </BrowserOnly>
          </div>
        </section>

        <section className={styles.explainer}>
          <div className="container">
            <div className={styles.explainerGrid}>
              <article>
                <span>01</span>
                <Heading as="h2">One session, two peers</Heading>
                <p>
                  The session ID is the only rendezvous key. Share it with a second browser or use the generated
                  Python command—there are no accounts, room setup, or permanent credentials.
                </p>
              </article>
              <article>
                <span>02</span>
                <Heading as="h2">Real infrastructure</Heading>
                <p>
                  The examples use LuxAI’s HTTP signaling endpoint and request short-lived TURN credentials at
                  runtime. Application data flows peer to peer whenever the network permits it.
                </p>
              </article>
              <article>
                <span>03</span>
                <Heading as="h2">Real MAGPIE APIs</Heading>
                <p>
                  The editor runs the browser bundle used by normal applications. Move the same connection,
                  stream, and RPC code into your project when you are ready.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}

function PlaygroundSkeleton(): React.ReactElement {
  return (
    <div className={styles.skeleton} aria-label="Loading playground">
      <div />
      <div />
    </div>
  );
}
