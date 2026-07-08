import React, {useEffect} from 'react';
import Layout from '@theme/Layout';
import {
  Hero,
  ProblemSolution,
  FeatureShowcase,
  TrustCards,
  FinalCTA,
  LandingFooter,
} from '@site/src/components/landing';
import styles from '@site/src/components/landing/landing.module.css';

export default function Home(): React.ReactElement {
  useEffect(() => {
    document.documentElement.classList.add('landing-page');
    return () => document.documentElement.classList.remove('landing-page');
  }, []);

  return (
    <Layout
      title="Actions Insights"
      description="GitHub-native test reports for GitHub Actions. Parse TRX, JUnit, NUnit, and xUnit results into PR comments, workflow summaries, and interactive reports.">
      <main className={styles.landing}>
        <Hero />
        <ProblemSolution />
        <FeatureShowcase />
        <TrustCards />
        <FinalCTA />
        <LandingFooter />
      </main>
    </Layout>
  );
}
