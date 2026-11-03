import { describe, expect, it } from 'vitest';
import { findExistingComment } from '../../src/github/comment';
import {
  buildCommentMarker,
  COMMENT_MARKER,
  DEFAULT_CHECK_NAME,
} from '../../src/reporting/pr-comment';
import { archiveCommentResults, buildCommentHistoryMarkers } from '../../src/reporting/comment-history';

describe('findExistingComment', () => {
  it('matches a scoped marker for the check-name', () => {
    const comments = [
      { id: 1, body: `${buildCommentMarker('Backend')}\n# Backend` },
      { id: 2, body: `${buildCommentMarker('CI unit')}\n# CI unit` },
    ];
    expect(findExistingComment(comments, 'Backend')?.id).toBe(1);
    expect(findExistingComment(comments, 'CI unit')?.id).toBe(2);
  });

  it('does not match a foreign publisher comment', () => {
    const comments = [{ id: 1, body: `${buildCommentMarker('Backend')}\n# Backend` }];
    expect(findExistingComment(comments, 'CI unit')).toBeUndefined();
  });

  it('does not match a marker embedded in report text', () => {
    const spoofed = [
      buildCommentMarker('Backend'),
      '# Failed — Backend',
      `Failure output contains ${buildCommentMarker('CI unit')} in stdout`,
    ].join('\n');
    const comments = [
      { id: 1, body: spoofed },
      { id: 2, body: `${buildCommentMarker('CI unit')}\n# CI unit` },
    ];
    expect(findExistingComment(comments, 'CI unit')?.id).toBe(2);
  });

  it('matches legacy unscoped marker only for the default check-name', () => {
    const comments = [{ id: 10, body: `${COMMENT_MARKER}\n# Legacy` }];
    expect(findExistingComment(comments, DEFAULT_CHECK_NAME)?.id).toBe(10);
    expect(findExistingComment(comments, 'Backend')).toBeUndefined();
    expect(findExistingComment(comments, 'Actions> Insights')).toBeUndefined();
  });

  it('prefers scoped default marker over legacy', () => {
    const comments = [
      { id: 1, body: `${COMMENT_MARKER}\n# Legacy` },
      { id: 2, body: `${buildCommentMarker(DEFAULT_CHECK_NAME)}\n# Scoped` },
    ];
    expect(findExistingComment(comments, DEFAULT_CHECK_NAME)?.id).toBe(2);
  });

  it('keeps collision-prone names on separate comments', () => {
    const comments = [
      { id: 1, body: `${buildCommentMarker('CI -- unit')}\n# dashdash` },
      { id: 2, body: `${buildCommentMarker('CI - unit')}\n# dash` },
    ];
    expect(findExistingComment(comments, 'CI -- unit')?.id).toBe(1);
    expect(findExistingComment(comments, 'CI - unit')?.id).toBe(2);
  });

  it('creates isolation so previous-results archive only the matched body', () => {
    const backendState = {
      completedAt: '2026-01-01 00:00:00 UTC',
      passed: 48,
      failed: 26,
      skipped: 0,
    };
    const vitestState = {
      completedAt: '2026-01-01 01:00:00 UTC',
      passed: 1165,
      failed: 0,
      skipped: 0,
    };
    const backendBody = [
      buildCommentMarker('Backend'),
      ...buildCommentHistoryMarkers(backendState, []),
      '# Failed — Backend',
    ].join('\n');
    const vitestBody = [
      buildCommentMarker('CI unit'),
      ...buildCommentHistoryMarkers(vitestState, []),
      '# Passed — CI unit',
    ].join('\n');
    const comments = [
      { id: 1, body: backendBody },
      { id: 2, body: vitestBody },
    ];

    const matched = findExistingComment(comments, 'CI unit');
    expect(matched?.id).toBe(2);
    expect(archiveCommentResults(matched!.body!)).toEqual([vitestState]);
  });
});
