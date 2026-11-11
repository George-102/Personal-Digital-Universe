module.exports = {
  ci: {
    collect: {
      staticDistDir: './out',
      // 只审计真实内容路由；404 错误页无 meta 属预期，不参与 SEO/a11y 门禁
      url: ['http://localhost/', 'http://localhost/en/'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        skipAudits: ['uses-http2'], // Cloudflare Pages 已处理，本地无需强制
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'interactive': ['warn', { maxNumericValue: 3500 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};