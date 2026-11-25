import { defineConfig } from 'vitest/config';

/**
 * T-003a：单元测试 runner 由 node:test 迁移到 Vitest。
 * include 显式限定 scripts/，避免 Vitest 默认 glob 误收 e2e/*.spec.ts（Playwright 用例）。
 */
export default defineConfig({
  test: {
    include: ['scripts/**/*.test.mjs'],
    environment: 'node',
    // Windows 下 threads/forks 会把 vitest 模块 externalize 成不同实例，test() 丢失 suite 上下文。
    // vmThreads 在 VM 上下文中运行测试，最小用例实测可正常收集与执行。
    pool: 'vmThreads',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: 'coverage',
      exclude: ['scripts/**', 'vendor/**', 'node_modules/**', 'e2e/**'],
      // T-003d：以实测基线（stmts 86.62 / branch 88.51 / func 90.05 / line 88.26）
      // 下调约 5~6 个百分点留 runner 余量；低于阈值即 fail，不删断言不降既有阈值。
      thresholds: {
        statements: 80,
        branches: 82,
        functions: 85,
        lines: 82,
      },
    },
  },
});
