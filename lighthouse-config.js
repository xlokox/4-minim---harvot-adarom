/**
 * Lighthouse Configuration for Performance Testing
 * This file contains configuration for running Lighthouse audits
 */

const lighthouseConfig = {
  extends: 'lighthouse:default',
  settings: {
    // Run audits for mobile and desktop
    formFactor: 'mobile',
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 150,
      downloadThroughputKbps: 1638.4,
      uploadThroughputKbps: 675
    },
    // Hebrew language support
    locale: 'he',
    // Skip certain audits that might not be relevant
    skipAudits: [
      'canonical',
      'robots-txt'
    ]
  },
  audits: [
    // Performance audits
    'first-contentful-paint',
    'largest-contentful-paint',
    'first-meaningful-paint',
    'speed-index',
    'interactive',
    'total-blocking-time',
    'cumulative-layout-shift',
    
    // Accessibility audits
    'color-contrast',
    'image-alt',
    'label',
    'link-name',
    'meta-viewport',
    'document-title',
    'html-has-lang',
    'html-lang-valid',
    
    // Best practices
    'uses-https',
    'uses-http2',
    'uses-responsive-images',
    'efficient-animated-content',
    'unused-css-rules',
    'unused-javascript',
    
    // SEO audits
    'meta-description',
    'font-size',
    'tap-targets',
    'structured-data'
  ],
  categories: {
    performance: {
      title: 'Performance',
      auditRefs: [
        {id: 'first-contentful-paint', weight: 10, group: 'metrics'},
        {id: 'largest-contentful-paint', weight: 25, group: 'metrics'},
        {id: 'first-meaningful-paint', weight: 10, group: 'metrics'},
        {id: 'speed-index', weight: 10, group: 'metrics'},
        {id: 'interactive', weight: 10, group: 'metrics'},
        {id: 'total-blocking-time', weight: 30, group: 'metrics'},
        {id: 'cumulative-layout-shift', weight: 5, group: 'metrics'}
      ]
    },
    accessibility: {
      title: 'Accessibility',
      description: 'These checks highlight opportunities to improve the accessibility of your web app.',
      auditRefs: [
        {id: 'color-contrast', weight: 3, group: 'a11y-color-contrast'},
        {id: 'image-alt', weight: 10, group: 'a11y-names-labels'},
        {id: 'label', weight: 10, group: 'a11y-names-labels'},
        {id: 'link-name', weight: 3, group: 'a11y-names-labels'}
      ]
    },
    'best-practices': {
      title: 'Best Practices',
      auditRefs: [
        {id: 'uses-https', weight: 5, group: 'best-practices-trust-safety'},
        {id: 'uses-http2', weight: 5, group: 'best-practices-ux'},
        {id: 'uses-responsive-images', weight: 5, group: 'best-practices-ux'}
      ]
    },
    seo: {
      title: 'SEO',
      description: 'These checks ensure that your page is optimized for search engine results ranking.',
      auditRefs: [
        {id: 'meta-description', weight: 5, group: 'seo-meta'},
        {id: 'document-title', weight: 5, group: 'seo-meta'},
        {id: 'font-size', weight: 5, group: 'seo-mobile'},
        {id: 'tap-targets', weight: 10, group: 'seo-mobile'}
      ]
    }
  }
};

module.exports = lighthouseConfig;
