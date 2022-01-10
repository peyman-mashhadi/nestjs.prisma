module.exports = function () {
  process.env.NODE_ENV = 'test';

  return {
    files: ['src/**/*.ts'],

    tests: ['src/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],

    env: {
      type: 'node',
    },
  };
};
