import React, {useEffect, useRef, type ReactNode} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';
import styles from './landing.module.css';

export function ScrollReveal({children, className}: {children: ReactNode; className?: string}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add(styles.scrollRevealActive);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.scrollRevealActive);
          }
        });
      },
      {threshold: 0.1, rootMargin: '0px 0px -50px 0px'},
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${styles.scrollReveal} ${className ?? ''}`}>
      {children}
    </div>
  );
}

export function Hero() {
  const logo = useBaseUrl('/logo-white.png');

  return (
    <header className={`${styles.hero} ${styles.snapTarget}`}>
      <div className={styles.heroBackground} aria-hidden="true" />
      <div className={styles.heroGrid} aria-hidden="true" />
      <div className={styles.heroFade} aria-hidden="true" />
      <div className={styles.heroContent}>
        <img src={logo} alt="Actions Insights" className={styles.heroLogo} />
        <h1 className={styles.heroTitle}>
          Stop Trawling Build Logs.
          <br />
          <span className={styles.heroAccent}>Start Seeing Actions Insights.</span>
        </h1>
        <p className={styles.heroSubtitle}>
          The open-source GitHub Action that transforms messy test results into
          beautiful, actionable feedback directly in your workflow.
        </p>
        <div className={styles.heroButtons}>
          <Link to="/docs/setup/quick-start" className={styles.btnPrimary}>
            Get Started →
          </Link>
          <Link to="/docs/setup/pr-comments" className={styles.btnGhost}>
            Live Demo
          </Link>
        </div>
      </div>
    </header>
  );
}

export function ProblemSolution() {
  const problems = [
    {
      icon: '📋',
      title: 'Messy Logs',
      text: 'Sifting through 10,000+ lines of raw console output just to find one failed assertion.',
    },
    {
      icon: '👁',
      title: 'Hidden Failures',
      text: 'Silent failures in CI that only surface days later when production is broken.',
    },
    {
      icon: '⏳',
      title: 'Time Wasted',
      text: 'Developers spend 30% of their day debugging infrastructure rather than shipping code.',
    },
  ];

  const solutions = [
    {
      icon: '✨',
      label: 'Automatic Summarization',
      text: 'Instant breakdown of passes, failures, and flakes.',
    },
    {
      icon: '💬',
      label: 'Contextual Comments',
      text: 'Rich PR comments with direct links to failing lines.',
    },
    {
      icon: '📊',
      label: 'Full-Scale Reports',
      text: 'Interactive web dashboards and workflow artifacts for deep investigation.',
    },
  ];

  return (
    <section className={`${styles.section} ${styles.snapTarget}`}>
      <div className={styles.container}>
        <div className={styles.problemSolutionGrid}>
          <ScrollReveal>
            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleError}`}>
              ⚠ The Problem
            </h2>
            <div className={styles.problemCards}>
              {problems.map((p) => (
                <div key={p.title} className={styles.problemCard}>
                  <div className={styles.iconBoxError}>{p.icon}</div>
                  <div>
                    <h3 className={styles.cardTitle}>{p.title}</h3>
                    <p className={styles.cardText}>{p.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal>
            <div className={styles.solutionGlow}>
              <div className={styles.glassCardSolution}>
                <h2 className={`${styles.sectionTitle} ${styles.sectionTitleSuccess}`}>
                  ✓ The Solution
                </h2>
                <div className={styles.terminalCallout}>
                  <p className={styles.terminalLine}>/ Parsing Results...</p>
                  <p className={styles.cardText}>
                    Actions Insights automatically ingests TRX, JUnit, NUnit, and xUnit
                    files from your test runners.
                  </p>
                </div>
                <ul className={styles.featureList}>
                  {solutions.map((s) => (
                    <li key={s.label} className={styles.featureListItem}>
                      <span className={styles.featureIcon}>{s.icon}</span>
                      <div>
                        <p className={styles.featureLabel}>{s.label}</p>
                        <p className={styles.cardText}>{s.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

export function FeatureShowcase() {
  const commentImg = useBaseUrl('/img/comment.png');
  const summaryImg = useBaseUrl('/img/web-workflow-summary.png');
  const allTestsImg = useBaseUrl('/img/web-workflow-all-tests.png');
  const repoImg = useBaseUrl('/img/web-repo-summary.png');

  return (
    <>
      <section className={`${styles.featureSection} ${styles.snapTarget}`}>
        <div className={styles.container}>
          <ScrollReveal className={styles.featureRow}>
            <div className={styles.featureContent}>
              <span className={styles.eyebrowPrimary}>INTEGRATED FEEDBACK</span>
              <h2 className={styles.featureTitle}>Actionable PR Comments</h2>
              <p className={styles.featureBody}>
                Never leave the PR view. Actions Insights posts detailed comments directly
                to your pull request, highlighting exactly which tests failed, providing
                stack traces, and offering historical context.
              </p>
              <div className={styles.metrics}>
                <div>
                  <div className={styles.metricValue}>0</div>
                  <div className={styles.metricLabel}>Context Switching</div>
                </div>
                <div className={styles.metricDivider} />
                <div>
                  <div className={styles.metricValue}>100%</div>
                  <div className={styles.metricLabel}>Traceability</div>
                </div>
              </div>
            </div>
            <div className={styles.featureImageWrap}>
              <img
                src={commentImg}
                alt="PR comment showing failed test details and stack trace"
                className={styles.featureImage}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section
        className={`${styles.featureSection} ${styles.featureSectionAfterStack} ${styles.snapTarget}`}>
        <div className={styles.container}>
          <ScrollReveal className={`${styles.featureRow} ${styles.featureRowReverse}`}>
            <div className={styles.featureContent}>
              <span className={styles.eyebrowSecondary}>VISUAL ANALYTICS</span>
              <h2 className={styles.featureTitle}>Deep-Dive Web Reports</h2>
              <p className={styles.featureBody}>
                When logs are not enough, jump into full-screen interactive reports.
                Explore every test case, filter results by suite or outcome, and track
                trends across runs.
              </p>
              <ul className={styles.checkList}>
                <li className={styles.checkListItem}>
                  <span className={styles.checkIcon}>✓</span> Searchable test database
                </li>
                <li className={styles.checkListItem}>
                  <span className={styles.checkIcon}>✓</span> Workflow summary integration
                </li>
                <li className={styles.checkListItem}>
                  <span className={styles.checkIcon}>✓</span> Flaky test identification
                </li>
              </ul>
            </div>
            <div className={`${styles.featureImageWrap} ${styles.featureImageStack}`}>
              <img
                src={summaryImg}
                alt="Dashboard overview with success metrics"
                className={`${styles.featureImage} ${styles.featureImageStackTop}`}
              />
              <img
                src={allTestsImg}
                alt="Detailed test results list"
                className={`${styles.featureImage} ${styles.featureImageStackBottom}`}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className={`${styles.featureSection} ${styles.snapTarget}`}>
        <div className={styles.container}>
          <ScrollReveal className={styles.featureRow}>
            <div className={styles.featureContent}>
              <span className={styles.eyebrowTertiary}>ORG-WIDE OVERVIEW</span>
              <h2 className={styles.featureTitle}>Global Health Dashboard</h2>
              <p className={styles.featureBody}>
                Aggregated insights across your entire organization. Track build health
                trends over weeks, identify the most expensive workflows, and pinpoint
                which repositories are struggling with stability.
              </p>
            </div>
            <div className={styles.featureImageWrap}>
              <img
                src={repoImg}
                alt="Organization-wide health dashboard with repository trends"
                className={styles.featureImage}
              />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}

export function TrustCards() {
  const cards = [
    {
      icon: '🛡',
      title: 'Apache 2.0 Licensed',
      text: 'Fully open-source and free for teams of all sizes. No vendor lock-in, no hidden tiers.',
    },
    {
      icon: '🔗',
      title: 'GitHub Native',
      text: 'Built for the GitHub ecosystem. Integrates with Actions, Checks, and Pages with zero external infra.',
    },
    {
      icon: '🔒',
      title: 'Privacy First',
      text: 'Your data never leaves GitHub. The history repository stays in your org — complete ownership.',
    },
  ];

  return (
    <section className={`${styles.section} ${styles.snapTarget}`} style={{background: 'var(--landing-surface-low)'}}>
      <div className={styles.container}>
        <ScrollReveal>
          <div className={styles.trustGrid}>
            {cards.map((card) => (
              <div key={card.title} className={styles.trustCard}>
                <span className={styles.trustIcon}>{card.icon}</span>
                <h3 className={styles.trustTitle}>{card.title}</h3>
                <p className={styles.trustText}>{card.text}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className={`${styles.section} ${styles.ctaSection} ${styles.snapTarget}`}>
      <div className={styles.ctaBackground} aria-hidden="true" />
      <ScrollReveal className={styles.ctaContent}>
        <h2 className={styles.ctaTitle}>Ready to upgrade your CI?</h2>
        <p className={styles.ctaSubtitle}>
          Stop digging through logs and start shipping with confidence.
        </p>
        <div className={styles.ctaButtons}>
          <a href="https://github.com/marketplace?query=actions-insights" className={styles.btnCtaPrimary} target="_blank" rel="noopener noreferrer">
            Install via Marketplace
          </a>
          <Link to="/docs/intro" className={styles.btnCtaGhost}>
            Read Documentation
          </Link>
        </div>
      </ScrollReveal>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className={`${styles.landingFooter} ${styles.snapTarget}`}>
      <div className={styles.landingFooterGrid}>
        <div>
          <span className={styles.landingFooterBrand}>Actions Insights</span>
          <p className={styles.landingFooterCopy}>
            © {new Date().getFullYear()} Actions Insights. Released under Apache 2.0
            License.
          </p>
        </div>
        <div className={styles.landingFooterLinks}>
          <Link to="/docs/intro" className={styles.landingFooterLink}>
            Documentation
          </Link>
          <a
            href="https://github.com/mzbrau/actions-insights"
            className={styles.landingFooterLink}
            target="_blank"
            rel="noopener noreferrer">
            GitHub
          </a>
          <a
            href="https://github.com/mzbrau/actions-insights/blob/main/LICENSE"
            className={styles.landingFooterLink}
            target="_blank"
            rel="noopener noreferrer">
            License
          </a>
        </div>
      </div>
    </footer>
  );
}
