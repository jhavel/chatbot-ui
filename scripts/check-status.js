#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.STATUS_BASE_URL || 'http://localhost:3000';
const ENDPOINTS = {
  health: '/api/health',
  status: '/api/status'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function displayHealthCheck(data) {
  console.log(colorize('\n🔍 Basic Health Check', 'cyan'));
  console.log(colorize('='.repeat(50), 'cyan'));
  
  const status = data.status === 'healthy' ? '🟢' : '🔴';
  console.log(`${status} Status: ${colorize(data.status.toUpperCase(), data.status === 'healthy' ? 'green' : 'red')}`);
  console.log(`📅 Timestamp: ${data.timestamp}`);
  console.log(`🗄️  Database: ${data.database === 'connected' ? '🟢' : '🔴'} ${data.database}`);
  console.log(`💾 Storage: ${data.storage === 'connected' ? '🟢' : '🔴'} ${data.storage}`);
  console.log(`📦 Version: ${data.version || 'unknown'}`);
}

function displayStatusReport(data) {
  console.log(colorize('\n🧪 Comprehensive System Status', 'magenta'));
  console.log(colorize('='.repeat(50), 'magenta'));
  
  const { overallStatus, tests, summary } = data;
  
  // Overall status
  const statusIcon = overallStatus === 'healthy' ? '🟢' : overallStatus === 'degraded' ? '🟡' : '🔴';
  console.log(`${statusIcon} Overall Status: ${colorize(overallStatus.toUpperCase(), 
    overallStatus === 'healthy' ? 'green' : overallStatus === 'degraded' ? 'yellow' : 'red')}`);
  
  // Summary
  console.log(colorize('\n📊 Summary:', 'bright'));
  console.log(`   Total Tests: ${colorize(summary.total, 'blue')}`);
  console.log(`   Passed: ${colorize(summary.passed, 'green')}`);
  console.log(`   Failed: ${colorize(summary.failed, 'red')}`);
  console.log(`   Warnings: ${colorize(summary.warnings, 'yellow')}`);
  
  const successRate = ((summary.passed / summary.total) * 100).toFixed(1);
  console.log(`   Success Rate: ${colorize(`${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red')}`);
  
  // Test details
  console.log(colorize('\n📋 Test Results:', 'bright'));
  tests.forEach((test, index) => {
    const statusIcon = test.status === 'pass' ? '🟢' : test.status === 'fail' ? '🔴' : '🟡';
    const statusColor = test.status === 'pass' ? 'green' : test.status === 'fail' ? 'red' : 'yellow';
    
    console.log(`\n${index + 1}. ${statusIcon} ${colorize(test.name, 'bright')}`);
    console.log(`   Description: ${test.description}`);
    console.log(`   Status: ${colorize(test.status.toUpperCase(), statusColor)}`);
    console.log(`   Details: ${test.details}`);
    
    if (test.duration) {
      const duration = test.duration < 1000 ? `${test.duration}ms` : `${(test.duration / 1000).toFixed(2)}s`;
      console.log(`   Duration: ${colorize(duration, 'blue')}`);
    }
    
    if (test.error) {
      console.log(`   Error: ${colorize(test.error, 'red')}`);
    }
  });
}

function displayTimestamp(data) {
  console.log(colorize('\n⏰ Report Generated:', 'cyan'));
  console.log(`   ${new Date(data.timestamp).toLocaleString()}`);
}

async function runStatusCheck() {
  console.log(colorize('🚀 Chatbot UI System Status Check', 'bright'));
  console.log(colorize('='.repeat(50), 'bright'));
  console.log(`Base URL: ${BASE_URL}\n`);
  
  try {
    // Health check
    console.log(colorize('Running basic health check...', 'blue'));
    const healthResponse = await makeRequest(`${BASE_URL}${ENDPOINTS.health}`);
    
    if (healthResponse.status === 200) {
      displayHealthCheck(healthResponse.data);
    } else {
      console.log(colorize(`❌ Health check failed with status ${healthResponse.status}`, 'red'));
      return;
    }
    
    // Comprehensive status check
    console.log(colorize('\nRunning comprehensive status check...', 'blue'));
    const statusResponse = await makeRequest(`${BASE_URL}${ENDPOINTS.status}`);
    
    if (statusResponse.status === 200) {
      displayStatusReport(statusResponse.data);
      displayTimestamp(statusResponse.data);
    } else if (statusResponse.status === 401) {
      console.log(colorize('\n⚠️  Status check requires authentication', 'yellow'));
      console.log('Please log in to the application first, then run this script again.');
    } else {
      console.log(colorize(`❌ Status check failed with status ${statusResponse.status}`, 'red'));
      if (statusResponse.data && statusResponse.data.error) {
        console.log(colorize(`Error: ${statusResponse.data.error}`, 'red'));
      }
    }
    
  } catch (error) {
    console.log(colorize(`❌ Error running status check: ${error.message}`, 'red'));
    
    if (error.code === 'ECONNREFUSED') {
      console.log(colorize('\n💡 Make sure the application is running:', 'yellow'));
      console.log('   npm run dev');
    } else if (error.code === 'ENOTFOUND') {
      console.log(colorize('\n💡 Check your BASE_URL configuration:', 'yellow'));
      console.log(`   Current: ${BASE_URL}`);
      console.log('   Set STATUS_BASE_URL environment variable if needed');
    }
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(colorize('Chatbot UI Status Check Script', 'bright'));
  console.log('\nUsage:');
  console.log('  node scripts/check-status.js [options]');
  console.log('\nOptions:');
  console.log('  --help, -h     Show this help message');
  console.log('  --url <url>    Set base URL for status check');
  console.log('\nEnvironment Variables:');
  console.log('  STATUS_BASE_URL  Base URL for the application (default: http://localhost:3000)');
  console.log('\nExamples:');
  console.log('  node scripts/check-status.js');
  console.log('  STATUS_BASE_URL=https://myapp.com node scripts/check-status.js');
  process.exit(0);
}

// Parse custom URL from arguments
const urlIndex = args.indexOf('--url');
if (urlIndex !== -1 && args[urlIndex + 1]) {
  process.env.STATUS_BASE_URL = args[urlIndex + 1];
}

// Run the status check
runStatusCheck().catch(console.error); 