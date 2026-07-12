import { describe, expect, it } from 'vitest';
import {
  archiveCommentResults,
  buildCommentHistoryMarkers,
  formatPreviousResultsSection,
  parseCommentState,
  parsePreviousResults,
} from '../../src/reporting/comment-history';
import { COMMENT_MARKER, renderPrComment } from '../../src/reporting/pr-comment';
import { buildReportingContext } from '../../src/reporting/context';
import { buildReportLinks } from '../../src/reporting/links';
import { sampleConfig, sampleRun } from './fixtures';

describe('comment-history', () => {
  const snapshot = {
    completedAt: '2026-01-01 00:01:00 UTC',
    passed: 1,
    failed: 1,
    skipped: 0,
  };

  it('buildCommentHistoryMarkers emits parseable markers', () => {
    const markers = buildCommentHistoryMarkers(snapshot, [snapshot]);
    const body = [COMMENT_MARKER, ...markers, 'content'].join('\n');
    expect(parseCommentState(body)).toEqual(snapshot);
    expect(parsePreviousResults(body)).toEqual([snapshot]);
  });

  it('archiveCommentResults appends current state to previous results', () => {
    const current = { completedAt: '2026-01-02 00:00:00 UTC', passed: 2, failed: 0, skipped: 0 };
    const body = [
      COMMENT_MARKER,
      ...buildCommentHistoryMarkers(current, []),
      '# Passed',
      '**✅ 2 passed · ❌ 0 failed · ⏭ 0 skipped · 100% · 1s**',
    ].join('\n');
    const archived = archiveCommentResults(body);
    expect(archived).toEqual([current]);
  });

  it('archiveCommentResults preserves existing previous results', () => {
    const previous = { completedAt: '2026-01-01 00:00:00 UTC', passed: 1, failed: 1, skipped: 0 };
    const current = { completedAt: '2026-01-02 00:00:00 UTC', passed: 2, failed: 0, skipped: 0 };
    const body = [
      COMMENT_MARKER,
      ...buildCommentHistoryMarkers(current, [previous]),
    ].join('\n');
    const archived = archiveCommentResults(body);
    expect(archived).toEqual([previous, current]);
  });

  it('parseCommentState falls back to visible markdown when markers are absent', () => {
    const body = [
      COMMENT_MARKER,
      '# Failed',
      '`abc1234` Fix tests · author · 2026-01-01 00:01:00 UTC',
      '**✅ 1 passed · ❌ 1 failed · ⏭ 0 skipped · 50% · 1s**',
    ].join('\n');
    expect(parseCommentState(body)).toEqual(snapshot);
  });

  it('formatPreviousResultsSection renders bullet list', () => {
    const section = formatPreviousResultsSection([snapshot]);
    const text = section.join('\n');
    expect(text).toContain('### Previous results');
    expect(text).toContain('2026-01-01 00:01:00 UTC · ✅ 1 passed · ❌ 1 failed · ⏭ 0 skipped');
  });
});

describe('pr-comment history integration', () => {
  it('includes Details link at top when history run URL is set', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const links = {
      ...buildReportLinks(sampleRun.context),
      historyRun: 'https://history.example.com/#/r/owner.repo/b/main/run/1',
    };
    const body = renderPrComment(ctx, sampleConfig, links);
    const detailsIndex = body.indexOf('[Details](https://history.example.com/#/r/owner.repo/b/main/run/1)');
    const statsIndex = body.indexOf('## Statistics');
    expect(detailsIndex).toBeGreaterThan(-1);
    expect(detailsIndex).toBeLessThan(statsIndex);
  });

  it('renders previous results section above footer', () => {
    const ctx = buildReportingContext(sampleRun, sampleConfig);
    const previousResults = [
      { completedAt: '2026-01-01 00:01:00 UTC', passed: 1, failed: 1, skipped: 0 },
    ];
    const body = renderPrComment(ctx, sampleConfig, buildReportLinks(sampleRun.context), previousResults);
    const previousIndex = body.indexOf('### Previous results');
    const footerIndex = body.indexOf('Actions Insights ·');
    expect(previousIndex).toBeGreaterThan(-1);
    expect(previousIndex).toBeLessThan(footerIndex);
    expect(body).toContain('actions-insights-state:');
    expect(body).toContain('actions-insights-previous-results:');
  });
});
