import { defineConfig } from 'vitest/config';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export default defineConfig({
  test: {
    env: {
      DATA_DIR: join(tmpdir(), 'whatmedia-api-test-jobs'),
      LOG_LEVEL: 'silent',
      STATS_FILE: join(tmpdir(), `whatmedia-api-test-stats-${process.pid}.json`),
      STATS_PUBLIC_THRESHOLD: '3',
    },
    testTimeout: 60_000,
  },
});
