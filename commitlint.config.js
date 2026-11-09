export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['core', 'config', 'web', 'app', 'api', 'ci', 'deploy', 'docs', 'quality'],
    ],
  },
};

