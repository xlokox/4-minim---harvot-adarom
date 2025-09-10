#!/usr/bin/env node

/**
 * Performance Testing Script
 * Runs Lighthouse audits and generates reports
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  url: 'http://localhost:8080',
  outputDir: './reports',
  reports: {
    html: 'lighthouse-report.html',
    json: 'lighthouse-report.json',
    csv: 'lighthouse-report.csv'
  }
};

// Lighthouse options
const lighthouseOptions = {
  logLevel: 'info',
  output: ['html', 'json'],
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  port: undefined, // Will be set when Chrome launches
};

// Chrome launch options
const chromeOptions = {
  chromeFlags: [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage'
  ]
};

/**
 * Create output directory if it doesn't exist
 */
function ensureOutputDir() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${CONFIG.outputDir}`);
  }
}

/**
 * Run Lighthouse audit
 */
async function runLighthouseAudit() {
  console.log('🚀 Starting Lighthouse audit...');
  console.log(`📊 Testing URL: ${CONFIG.url}`);
  
  let chrome;
  
  try {
    // Launch Chrome
    console.log('🌐 Launching Chrome...');
    chrome = await chromeLauncher.launch(chromeOptions);
    lighthouseOptions.port = chrome.port;
    
    // Run Lighthouse
    console.log('⚡ Running Lighthouse audit...');
    const runnerResult = await lighthouse(CONFIG.url, lighthouseOptions);
    
    // Extract results
    const reportHtml = runnerResult.report[0];
    const reportJson = runnerResult.report[1];
    const lhr = runnerResult.lhr;
    
    // Save reports
    await saveReports(reportHtml, reportJson, lhr);
    
    // Display summary
    displaySummary(lhr);
    
    console.log('✅ Lighthouse audit completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running Lighthouse audit:', error);
    process.exit(1);
  } finally {
    if (chrome) {
      await chrome.kill();
      console.log('🔒 Chrome browser closed');
    }
  }
}

/**
 * Save reports to files
 */
async function saveReports(htmlReport, jsonReport, lhr) {
  console.log('💾 Saving reports...');
  
  // Save HTML report
  const htmlPath = path.join(CONFIG.outputDir, CONFIG.reports.html);
  fs.writeFileSync(htmlPath, htmlReport);
  console.log(`📄 HTML report saved: ${htmlPath}`);
  
  // Save JSON report
  const jsonPath = path.join(CONFIG.outputDir, CONFIG.reports.json);
  fs.writeFileSync(jsonPath, jsonReport);
  console.log(`📋 JSON report saved: ${jsonPath}`);
  
  // Generate CSV summary
  const csvContent = generateCSVSummary(lhr);
  const csvPath = path.join(CONFIG.outputDir, CONFIG.reports.csv);
  fs.writeFileSync(csvPath, csvContent);
  console.log(`📊 CSV summary saved: ${csvPath}`);
}

/**
 * Generate CSV summary of key metrics
 */
function generateCSVSummary(lhr) {
  const metrics = [
    'first-contentful-paint',
    'largest-contentful-paint',
    'first-meaningful-paint',
    'speed-index',
    'interactive',
    'total-blocking-time',
    'cumulative-layout-shift'
  ];
  
  let csv = 'Metric,Score,Value,Unit\n';
  
  metrics.forEach(metricId => {
    const audit = lhr.audits[metricId];
    if (audit) {
      const score = audit.score ? Math.round(audit.score * 100) : 'N/A';
      const value = audit.displayValue || audit.numericValue || 'N/A';
      const unit = audit.numericUnit || '';
      csv += `${audit.title},${score},${value},${unit}\n`;
    }
  });
  
  // Add category scores
  csv += '\nCategory,Score\n';
  Object.entries(lhr.categories).forEach(([categoryId, category]) => {
    const score = Math.round(category.score * 100);
    csv += `${category.title},${score}\n`;
  });
  
  return csv;
}

/**
 * Display summary in console
 */
function displaySummary(lhr) {
  console.log('\n📊 LIGHTHOUSE AUDIT SUMMARY');
  console.log('=' .repeat(50));
  
  // Category scores
  Object.entries(lhr.categories).forEach(([categoryId, category]) => {
    const score = Math.round(category.score * 100);
    const emoji = score >= 90 ? '🟢' : score >= 50 ? '🟡' : '🔴';
    console.log(`${emoji} ${category.title}: ${score}/100`);
  });
  
  console.log('\n⚡ KEY PERFORMANCE METRICS');
  console.log('-' .repeat(30));
  
  // Key metrics
  const keyMetrics = [
    'first-contentful-paint',
    'largest-contentful-paint',
    'speed-index',
    'interactive',
    'total-blocking-time',
    'cumulative-layout-shift'
  ];
  
  keyMetrics.forEach(metricId => {
    const audit = lhr.audits[metricId];
    if (audit) {
      const value = audit.displayValue || 'N/A';
      console.log(`• ${audit.title}: ${value}`);
    }
  });
  
  console.log('\n🎯 RECOMMENDATIONS');
  console.log('-' .repeat(20));
  
  // Show top opportunities
  const opportunities = Object.values(lhr.audits)
    .filter(audit => audit.details && audit.details.type === 'opportunity')
    .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0))
    .slice(0, 3);
  
  if (opportunities.length > 0) {
    opportunities.forEach((audit, index) => {
      console.log(`${index + 1}. ${audit.title}`);
      if (audit.displayValue) {
        console.log(`   Potential savings: ${audit.displayValue}`);
      }
    });
  } else {
    console.log('🎉 No major optimization opportunities found!');
  }
  
  console.log('\n' + '=' .repeat(50));
}

/**
 * Check if server is running
 */
async function checkServer() {
  try {
    const response = await fetch(CONFIG.url);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Performance Testing Tool');
  console.log('=' .repeat(30));
  
  // Check if server is running
  console.log('🌐 Checking if local server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Local server is not running!');
    console.log('💡 Please start the server first:');
    console.log('   npm run serve');
    console.log('   or');
    console.log('   python3 -m http.server 8080');
    process.exit(1);
  }
  
  console.log('✅ Server is running');
  
  // Ensure output directory exists
  ensureOutputDir();
  
  // Run the audit
  await runLighthouseAudit();
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runLighthouseAudit, CONFIG };
