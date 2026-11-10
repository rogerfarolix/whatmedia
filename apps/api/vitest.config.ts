import { defineConfig } from 'vitest/config';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export default defineConfig({
  test: {
    env: {
      DATA_DIR: join(tmpdir(), 'whatmedia-api-test-jobs'),
      LOG_LEVEL: 'silent',
    },
    testTimeout: 60_000,
  },
});
