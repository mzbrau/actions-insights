#!/usr/bin/env node
'use strict';

const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: ['src/main.ts'],
    bundle: true,
    platform: 'node',
    target: 'node24',
    outfile: 'dist/index.js',
    format: 'cjs',
    sourcemap: true,
    legalComments: 'inline',
    // @azure/storage-common (via @actions/artifact) calls createRequire(import.meta.url).
    // esbuild CJS replaces import.meta with {}, so define a file URL for the bundle.
    banner: {
      js: "const __import_meta_url = require('url').pathToFileURL(__filename).href;",
    },
    define: {
      'import.meta.url': '__import_meta_url',
    },
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
