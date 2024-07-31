import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import Heading from '@theme/Heading';
import styles from './index.module.css';

const Card = ({ title, children, icon }) => (
  <div>
    <h2>
      <span>{title}</span>
      <span role="image">{icon}</span>
    </h2>
    {children}
  </div>
)

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <img src="/img/logo.svg" style={{width: "100px"}}/>
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <p>
          This is a work-in-progress to provide documentation for Morio.
          <br />
          While you wait for more exciting content, perhaps you can <a href="https://github.com/certeu/morio">give us a star on GitHub</a>.
        </p>
        <div className={clsx('flex_wrapper', styles.flexWrapper)}>
          <Card title="Connect" icon="🔌">
            Deploy the Morio client, or ingest data from a wide range of sources. Logs, metrics, audit, healthchecks, we have it covered.
          </Card>
          <Card title="Stream" icon="💧">
            Route, split, or transform your data streams or write them to your datastore without the headaches of running streaming infrastructure.
          </Card>
          <Card title="Observe" icon="👀">
            Use on-board stream processing, or bring your own Kafka-compatible stream processor. Either way, real-time insights are dope.
          </Card>
          <Card title="Respond" icon="🚨">
            Raise alarms, trigger webhooks (or send emails if you&apos;re old-school).
            Once you know what&apos;s happening in near real time, why wait?
          </Card>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
      </main>
    </Layout>
  );
}
