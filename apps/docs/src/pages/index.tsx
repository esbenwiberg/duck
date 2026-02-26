import React from "react";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

const features = [
  {
    icon: "🔍",
    title: "TypeScript-aware parsing",
    desc: "Uses the TypeScript compiler API — not regex — to extract functions, types, classes, and JSDoc with precision.",
  },
  {
    icon: "✨",
    title: "LLM-generated docs",
    desc: "Claude reads your structured metadata and writes clear, accurate markdown documentation every time.",
  },
  {
    icon: "🔒",
    title: "Drift detection",
    desc: "Content hashes catch when source changes without regenerating docs. CI fails before stale docs ship.",
  },
  {
    icon: "🖼️",
    title: "Screenshot automation",
    desc: "Define YAML scenarios. Playwright captures them. Claude captions them. User guides write themselves.",
  },
  {
    icon: "🧪",
    title: "Example validation",
    desc: "Code blocks in your generated docs are extracted and executed via bun eval to catch broken examples.",
  },
  {
    icon: "🤖",
    title: "LLM review pass",
    desc: "A second Claude call reads your source and docs side-by-side, flagging inaccuracies and missing coverage.",
  },
];

function HeroSection() {
  return (
    <header className={styles.hero}>
      <div className={styles.heroInner}>
        <div className={styles.heroBadge}>AI-powered docs automation</div>
        <h1 className={styles.heroTitle}>
          Docs that stay in sync
          <br />
          <span className={styles.heroAccent}>with your code.</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Duck parses your TypeScript, generates markdown with Claude, and validates
          everything — drift, screenshots, examples, and accuracy — before you ship.
        </p>
        <div className={styles.heroButtons}>
          <Link className={styles.btnPrimary} to="/docs/getting-started/installation">
            Get started →
          </Link>
          <Link className={styles.btnSecondary} to="/docs/intro">
            See how it works
          </Link>
        </div>

        <div className={styles.terminalWrapper}>
          <div className={styles.terminalBar}>
            <span className={styles.dot} style={{ background: "#ff5f56" }} />
            <span className={styles.dot} style={{ background: "#ffbd2e" }} />
            <span className={styles.dot} style={{ background: "#27c93f" }} />
            <span className={styles.terminalTitle}>terminal</span>
          </div>
          <pre className={styles.terminal}>{`$ docsbot generate --target ./src --output ./docs/api

  Generating agent docs
  source : /project/src
  output : /project/docs/api

  found 12 source file(s)

  generated: 12 module(s)
  skipped  : 0 module(s) (unchanged)

Done. ✓`}</pre>
        </div>
      </div>
    </header>
  );
}

function FeaturesSection() {
  return (
    <section className={styles.features}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Everything docs need to stay healthy</h2>
        <p className={styles.sectionSubtitle}>
          One tool covers the full documentation lifecycle — from generation to validation.
        </p>
        <div className={styles.featureGrid}>
          {features.map((f) => (
            <div className={styles.featureCard} key={f.title}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { n: "01", title: "Parse", desc: "Duck walks your source files and extracts structured metadata using the TypeScript compiler." },
    { n: "02", title: "Generate", desc: "Claude receives the metadata and writes clear, accurate markdown. New files only if source changed." },
    { n: "03", title: "Validate", desc: "Four checks run: drift detection, screenshot hashes, code example execution, and an LLM review pass." },
    { n: "04", title: "Ship", desc: "CI exits 0 when everything passes. Fail early, fix quickly, ship confidently." },
  ];

  return (
    <section className={styles.howItWorks}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>How it works</h2>
        <div className={styles.stepsGrid}>
          {steps.map((s) => (
            <div className={styles.step} key={s.n}>
              <div className={styles.stepNumber}>{s.n}</div>
              <h3 className={styles.stepTitle}>{s.title}</h3>
              <p className={styles.stepDesc}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.cta}>
      <div className={styles.container}>
        <h2>Start in 2 minutes</h2>
        <p>Install docsbot and run your first generation against any TypeScript project.</p>
        <Link className={styles.btnPrimary} to="/docs/getting-started/installation">
          Read the docs →
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <HeroSection />
      <main>
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>
    </Layout>
  );
}
