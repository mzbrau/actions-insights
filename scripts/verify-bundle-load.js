#!/usr/bin/env node
'use strict';

/**
 * Smoke-test that dist/index.js evaluates without a load-time crash
 * (e.g. createRequire(import.meta.url) with undefined URL).
 * Exits immediately after require so the action's async run() does not execute.
 */
try {
  require('../dist/index.js');
  console.log('dist/index.js loaded successfully');
  process.exit(0);
} catch (error) {
  console.error('Bundle failed to load:', error);
  process.exit(1);
}
