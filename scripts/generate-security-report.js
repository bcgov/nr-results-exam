const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load configurations and inputs
const configPath = path.join(__dirname, 'reporting-config.json');
let config = {
  appName: "NR Results Exam",
  businessCriticality: "Medium",
  effortHours: { critical: 16, high: 8, medium: 4, low: 2, info: 0 }
};

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.error('Warning: Failed to parse reporting-config.json, using defaults.', e);
  }
}

// Variables from environment or defaults
const scanTarget = process.env.SCAN_TARGET || "https://results-exam-test.apps.silver.devops.gov.bc.ca";
const reportTitle = process.env.REPORT_TITLE || "Vulnerability Scan & Management Report";
const appName = process.env.APP_NAME || config.appName;
const repo = process.env.GITHUB_REPOSITORY || "bcgov/nr-results-exam";
const runNumber = process.env.GITHUB_RUN_NUMBER || "0";
const reportDateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const reportDateTime = new Date().toUTCString();

console.log(`Starting security report compilation for ${appName}...`);
console.log(`Scan Target: ${scanTarget}`);
console.log(`Date: ${reportDateStr}`);

// Helper to run shell commands safely
function runCmd(cmd, fallback = '') {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (e) {
    return fallback;
  }
}

// 1. PARSE ZAP RESULTS
console.log('Parsing ZAP results...');
let zapMetrics = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0, ignored: 0 };
let zapTopAlerts = [];

// Load ZAP accepted rule exclusions from tests/.zap/rules.tsv
const zapRulesFile = path.join(__dirname, '..', 'tests', '.zap', 'rules.tsv');
const ignoredAlertIds = new Set();
if (fs.existsSync(zapRulesFile)) {
  try {
    const lines = fs.readFileSync(zapRulesFile, 'utf8').split('\n');
    lines.forEach(line => {
      const match = line.match(/^(\d+)\s+IGNORE/);
      if (match) {
        ignoredAlertIds.add(match[1]);
      }
    });
    console.log(`Loaded ignored ZAP Alert IDs: ${Array.from(ignoredAlertIds).join(', ')}`);
  } catch (e) {
    console.error('Warning: Failed to load tests/.zap/rules.tsv', e);
  }
}

const zapJsonFile = path.join(__dirname, '..', 'zap-report.json');
if (fs.existsSync(zapJsonFile)) {
  try {
    const zapData = JSON.parse(fs.readFileSync(zapJsonFile, 'utf8'));
    const sites = zapData.site || [];
    sites.forEach(site => {
      const alerts = site.alerts || [];
      alerts.forEach(alert => {
        const pluginId = String(alert.pluginid);
        const isIgnored = ignoredAlertIds.has(pluginId);
        
        const riskCode = Number(alert.riskcode); // 4=Critical, 3=High, 2=Medium, 1=Low, 0=Info
        if (isIgnored) {
          zapMetrics.ignored++;
        } else {
          if (riskCode === 4) zapMetrics.critical++;
          else if (riskCode === 3) zapMetrics.high++;
          else if (riskCode === 2) zapMetrics.medium++;
          else if (riskCode === 1) zapMetrics.low++;
          else if (riskCode === 0) zapMetrics.info++;
          
          if (riskCode >= 3 && zapTopAlerts.length < 5) {
            zapTopAlerts.push({
              name: alert.name,
              severity: riskCode === 4 ? 'Critical' : 'High',
              pluginId: pluginId,
              description: alert.desc || 'No description provided'
            });
          }
        }
      });
    });
    zapMetrics.total = zapMetrics.critical + zapMetrics.high + zapMetrics.medium + zapMetrics.low + zapMetrics.info;
    console.log(`Parsed ZAP: ${zapMetrics.total} active, ${zapMetrics.ignored} ignored`);
  } catch (e) {
    console.error('Failed to parse zap-report.json, assuming empty results.', e);
  }
}

// 2. PARSE NUCLEI RESULTS
console.log('Parsing Nuclei results...');
let nucleiMetrics = { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 };
const nucleiJsonlFile = path.join(__dirname, '..', 'nuclei-results.jsonl');
const nucleiJsonFile = path.join(__dirname, '..', 'nuclei-results.json');

let nucleiRawData = [];
if (fs.existsSync(nucleiJsonlFile)) {
  try {
    const lines = fs.readFileSync(nucleiJsonlFile, 'utf8').split('\n').filter(Boolean);
    lines.forEach(line => {
      try {
        nucleiRawData.push(JSON.parse(line));
      } catch (err) {}
    });
  } catch (e) {
    console.error('Warning: Failed to read nuclei-results.jsonl', e);
  }
} else if (fs.existsSync(nucleiJsonFile)) {
  try {
    nucleiRawData = JSON.parse(fs.readFileSync(nucleiJsonFile, 'utf8'));
  } catch (e) {
    console.error('Warning: Failed to read nuclei-results.json', e);
  }
}

nucleiRawData.forEach(item => {
  const severity = String(item.info?.severity || '').toLowerCase();
  if (severity === 'critical') nucleiMetrics.critical++;
  else if (severity === 'high') nucleiMetrics.high++;
  else if (severity === 'medium') nucleiMetrics.medium++;
  else if (severity === 'low') nucleiMetrics.low++;
  else if (severity === 'info') nucleiMetrics.info++;
});
nucleiMetrics.total = nucleiMetrics.critical + nucleiMetrics.high + nucleiMetrics.medium + nucleiMetrics.low + nucleiMetrics.info;
console.log(`Parsed Nuclei: ${nucleiMetrics.total} findings`);

// 3. FETCH GITHUB SECURITY ALERTS SUMMARY
console.log('Fetching GitHub Security Alerts...');
let dependabotCount = 0;
let codeScanMetrics = { total: 0, open: 0, fixed: 0, dismissed: 0, critical: 0, high: 0, medium: 0, unassigned: 0, avgAge: 0, oldestAge: 0, resolutionRate: 0 };

try {
  const openDependabot = runCmd(`gh api "repos/${repo}/dependabot/alerts?state=open" --paginate --jq '.[].number'`);
  dependabotCount = openDependabot ? openDependabot.split('\n').filter(Boolean).length : 0;
  
  // Fetch Code Scanning Alerts
  const openCode = runCmd(`gh api "repos/${repo}/code-scanning/alerts?state=open" --paginate --jq '.[]'`);
  const fixedCode = runCmd(`gh api "repos/${repo}/code-scanning/alerts?state=fixed" --paginate --jq '.[]'`);
  const dismissedCode = runCmd(`gh api "repos/${repo}/code-scanning/alerts?state=dismissed" --paginate --jq '.[]'`);
  
  const parseJsonList = (str) => {
    if (!str) return [];
    const lines = str.split('\n').map(line => line.trim()).filter(Boolean);
    const list = [];
    lines.forEach(line => {
      try {
        const parsed = JSON.parse(line);
        if (Array.isArray(parsed)) {
          list.push(...parsed);
        } else {
          list.push(parsed);
        }
      } catch (e) {
        if (line === '[' || line === ']' || line === '],') return;
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) {
            list.push(...parsed);
          } else {
            list.push(parsed);
          }
        } catch (err) {}
      }
    });
    return list.filter(Boolean);
  };
  
  const openAlerts = parseJsonList(openCode);
  const fixedAlerts = parseJsonList(fixedCode);
  const dismissedAlerts = parseJsonList(dismissedCode);
  
  codeScanMetrics.open = openAlerts.length;
  codeScanMetrics.fixed = fixedAlerts.length;
  codeScanMetrics.dismissed = dismissedAlerts.length;
  codeScanMetrics.total = codeScanMetrics.open + codeScanMetrics.fixed + codeScanMetrics.dismissed;
  
  openAlerts.forEach(alert => {
    const sev = String(alert.rule?.security_severity_level || '').toLowerCase();
    if (sev === 'critical') codeScanMetrics.critical++;
    else if (sev === 'high') codeScanMetrics.high++;
    else if (sev === 'medium') codeScanMetrics.medium++;
    
    if (!alert.assignees || alert.assignees.length === 0) {
      codeScanMetrics.unassigned++;
    }
  });
  
  // Calculate average and oldest age for open alerts
  if (openAlerts.length > 0) {
    const nowSecs = Math.floor(Date.now() / 1000);
    let totalAge = 0;
    let maxAge = 0;
    
    openAlerts.forEach(alert => {
      const createdSecs = Math.floor(new Date(alert.created_at).getTime() / 1000);
      const ageDays = Math.floor((nowSecs - createdSecs) / 86400);
      totalAge += ageDays;
      if (ageDays > maxAge) maxAge = ageDays;
    });
    
    codeScanMetrics.avgAge = Math.floor(totalAge / openAlerts.length);
    codeScanMetrics.oldestAge = maxAge;
  }
  
  if (codeScanMetrics.total > 0) {
    codeScanMetrics.resolutionRate = Math.floor((codeScanMetrics.fixed * 100) / codeScanMetrics.total);
  }
} catch (e) {
  console.error('Warning: Failed to fetch GitHub Security alerts via CLI.', e.message);
}

// 4. FETCH DEPLOYMENT METRICS (Issue #554)
console.log('Fetching Deployment Metrics...');
let deploymentMetrics = { frequency: 0, successRate: 100, lastTimestamp: 'N/A', rollbackCount: 0, mttr: 'N/A' };
try {
  const mergeRunsOutput = runCmd(`gh api "repos/${repo}/actions/workflows/merge.yml/runs?per_page=100"`);
  if (mergeRunsOutput) {
    const mergeRunsData = JSON.parse(mergeRunsOutput);
    const runs = mergeRunsData.workflow_runs || [];
    
    if (runs.length > 0) {
      const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const recentRuns = runs.filter(run => new Date(run.created_at).getTime() >= last30Days);
      deploymentMetrics.frequency = recentRuns.length;
      
      const successfulRuns = runs.filter(run => run.conclusion === 'success');
      deploymentMetrics.successRate = runs.length > 0 ? Math.floor((successfulRuns.length * 100) / runs.length) : 100;
      
      if (successfulRuns.length > 0) {
        deploymentMetrics.lastTimestamp = new Date(successfulRuns[0].created_at).toISOString().split('T')[0];
      }
      
      // Calculate rollbacks: assume any triggered by a tag reversion or with failed outcomes that are followed by rollbacks count
      // For simplicity, count conclusion failures as indicator of stability problems
      deploymentMetrics.rollbackCount = runs.filter(run => run.conclusion === 'failure' && run.event === 'push').length;
      
      // Calculate MTTR for failed deployments
      let totalRecoveryMs = 0;
      let recoveries = 0;
      
      for (let i = 0; i < runs.length - 1; i++) {
        if (runs[i].conclusion === 'success' && runs[i+1].conclusion === 'failure') {
          // Found a recovery pair (remember runs are returned reverse-chronological, so index i is newer than i+1)
          const failedTime = new Date(runs[i+1].created_at).getTime();
          const recoveredTime = new Date(runs[i].created_at).getTime();
          totalRecoveryMs += (recoveredTime - failedTime);
          recoveries++;
        }
      }
      
      if (recoveries > 0) {
        const avgHours = (totalRecoveryMs / (1000 * 60 * 60 * recoveries)).toFixed(1);
        deploymentMetrics.mttr = `${avgHours} hours`;
      }
    }
  }
} catch (e) {
  console.error('Warning: Failed to calculate deployment metrics.', e.message);
}

// 5. PARSE DEEP HEALTH & PERFORMANCE METRICS (Issue #553)
console.log('Querying application Deep Health & Performance...');
let healthMetrics = {
  overallStatus: 'N/A',
  healthLatencyMs: 'N/A',
  chesLatency: 'N/A',
  s3Latency: 'N/A',
  cognitoLatency: 'N/A'
};

try {
  // Hit health endpoint with deep=true and time it
  const start = Date.now();
  const healthJsonStr = runCmd(`curl -s "${scanTarget}/health?deep=true"`);
  const latency = Date.now() - start;
  healthMetrics.healthLatencyMs = `${latency}ms`;

  if (healthJsonStr) {
    const healthData = JSON.parse(healthJsonStr);
    healthMetrics.overallStatus = String(healthData.status || 'unknown').toUpperCase();
    
    const deps = healthData.dependencies || {};
    if (deps.ches) healthMetrics.chesLatency = deps.ches.status === 'ok' ? `${deps.ches.latencyMs}ms` : 'FAIL';
    if (deps.objectStorage) healthMetrics.s3Latency = deps.objectStorage.status === 'ok' ? `${deps.objectStorage.latencyMs}ms` : 'FAIL';
    if (deps.federatedAuth) healthMetrics.cognitoLatency = deps.federatedAuth.status === 'ok' ? `${deps.federatedAuth.latencyMs}ms` : 'FAIL';
  }
} catch (e) {
  console.error('Warning: Failed to fetch target deep health check.', e.message);
  healthMetrics.overallStatus = 'OFFLINE';
}

// 6. FETCH SONARCLOUD QUALITY MEASURES
console.log('Fetching SonarCloud quality metrics...');
let backendCoverage = 'N/A';
let frontendCoverage = 'N/A';

const sonarApi = "https://sonarcloud.io/api/measures/component";
const sonarBackendProject = process.env.SONAR_BACKEND_PROJECT || "nr-results-exam-backend";
const sonarFrontendProject = process.env.SONAR_FRONTEND_PROJECT || "nr-results-exam-frontend";

try {
  const backendAuth = process.env.SONAR_BACKEND_TOKEN ? `-u "${process.env.SONAR_BACKEND_TOKEN}:"` : '';
  const bRes = runCmd(`curl -s ${backendAuth} "${sonarApi}?component=${sonarBackendProject}&metricKeys=coverage"`);
  if (bRes) {
    const data = JSON.parse(bRes);
    const value = data.component?.measures?.[0]?.value;
    if (value) backendCoverage = `${value}%`;
  }
} catch (e) {}

try {
  const frontendAuth = process.env.SONAR_FRONTEND_TOKEN ? `-u "${process.env.SONAR_FRONTEND_TOKEN}:"` : '';
  const fRes = runCmd(`curl -s ${frontendAuth} "${sonarApi}?component=${sonarFrontendProject}&metricKeys=coverage"`);
  if (fRes) {
    const data = JSON.parse(fRes);
    const value = data.component?.measures?.[0]?.value;
    if (value) frontendCoverage = `${value}%`;
  }
} catch (e) {}

// 7. PARSE NPM OUTDATED DEPS
console.log('Parsing Outdated Dependencies...');
let backendOutdated = 0;
let frontendOutdated = 0;
try {
  const bOut = runCmd(`cd backend && npm outdated --json`, '{}');
  backendOutdated = Object.keys(JSON.parse(bOut || '{}')).length;
} catch (e) {}
try {
  const fOut = runCmd(`cd frontend && npm outdated --json`, '{}');
  frontendOutdated = Object.keys(JSON.parse(fOut || '{}')).length;
} catch (e) {}

// 8. BUSINESS ASSESSMENT & REMEDIATION EFFORT (Issue #555 & #562)
const criticalTotal = zapMetrics.critical + nucleiMetrics.critical;
const highTotal = zapMetrics.high + nucleiMetrics.high;
const mediumTotal = zapMetrics.medium + nucleiMetrics.medium;
const lowTotal = zapMetrics.low + nucleiMetrics.low;
const infoTotal = zapMetrics.info + nucleiMetrics.info;

const remediationDebt = 
  (criticalTotal * config.effortHours.critical) +
  (highTotal * config.effortHours.high) +
  (mediumTotal * config.effortHours.medium) +
  (lowTotal * config.effortHours.low);

const riskScore = Math.min(100, (criticalTotal * 10) + (highTotal * 5) + (mediumTotal * 2));

let securityStatus = "🟢 LOW RISK";
let statusDesc = "Security posture is acceptable.";
let statusIcon = "fa-shield-halved";
let statusIconClass = "trend-down";

if (criticalTotal > 0) {
  securityStatus = "🔴 CRITICAL RISK";
  statusDesc = "Immediate action required. Critical severity bugs detected.";
  statusIcon = "fa-radiation";
  statusIconClass = "trend-up";
} else if (highTotal > 0) {
  securityStatus = "🟠 HIGH RISK";
  statusDesc = "High-risk vulnerabilities detected. Address within 30 days.";
  statusIcon = "fa-circle-exclamation";
  statusIconClass = "trend-up";
} else if (mediumTotal > 5) {
  securityStatus = "🟡 MODERATE RISK";
  statusDesc = "Multiple medium-risk items detected. Plan fixes.";
  statusIcon = "fa-triangle-exclamation";
  statusIconClass = "trend-stable";
}

// 9. HISTORY ENGINE (Issue #550 & #556)
console.log('Updating Historical Records...');
const reportsDir = path.join(__dirname, '..', 'docs', 'reports');
const historyFile = path.join(reportsDir, 'history.json');

// Ensure reports folder exists
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

let historyData = [];
if (fs.existsSync(historyFile)) {
  try {
    historyData = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
  } catch (e) {
    console.error('Warning: Failed to parse history.json, generating fresh history array.');
  }
}

// Create new entry
const newHistoryEntry = {
  date: reportDateStr,
  runNumber: Number(runNumber),
  riskScore: riskScore,
  totalVulnerabilities: criticalTotal + highTotal + mediumTotal + lowTotal + infoTotal,
  criticalCount: criticalTotal,
  highCount: highTotal,
  mediumCount: mediumTotal,
  lowCount: lowTotal + infoTotal,
  securityStatus: securityStatus,
  backendCoverage: backendCoverage.replace('%', ''),
  frontendCoverage: frontendCoverage.replace('%', ''),
  remediationDebt: remediationDebt
};

// Filter out any older entry for the same date to make it idempotent
historyData = historyData.filter(entry => entry.date !== reportDateStr);
historyData.push(newHistoryEntry);

// Limit history to last 50 runs
if (historyData.length > 50) {
  historyData.sort((a, b) => new Date(a.date) - new Date(b.date));
  historyData = historyData.slice(historyData.length - 50);
}

fs.writeFileSync(historyFile, JSON.stringify(historyData, null, 2), 'utf8');
console.log(`Saved run metadata to history.json. Active history points: ${historyData.length}`);

// 10. COMPILE HTML DASHBOARD INDEX
console.log('Compiling main HTML Dashboard...');
const dashboardTemplateFile = path.join(__dirname, 'dashboard-template.html');
if (fs.existsSync(dashboardTemplateFile)) {
  let htmlContent = fs.readFileSync(dashboardTemplateFile, 'utf8');
  const dashboardTotalVulnerabilities = criticalTotal + highTotal + mediumTotal + lowTotal + infoTotal;
  
  htmlContent = htmlContent
    .replace(/APP_NAME_PLACEHOLDER/g, appName)
    .replace(/DATE_PLACEHOLDER/g, reportDateTime)
    .replace(/RISK_SCORE_PLACEHOLDER/g, String(riskScore))
    .replace(/TOTAL_VULNS_PLACEHOLDER/g, String(dashboardTotalVulnerabilities))
    .replace(/BACKEND_COVERAGE_PLACEHOLDER/g, backendCoverage)
    .replace(/FRONTEND_COVERAGE_PLACEHOLDER/g, frontendCoverage)
    .replace(/SECURITY_STATUS_PLACEHOLDER/g, securityStatus)
    .replace(/TECHNICAL_STATUS_DESC_PLACEHOLDER/g, statusDesc)
    .replace(/REMEDIATION_DEBT_PLACEHOLDER/g, String(remediationDebt))
    .replace(/BUSINESS_CRITICALITY_PLACEHOLDER/g, config.businessCriticality)
    .replace(/REPO_PLACEHOLDER/g, repo)
    .replace(/SONAR_BACKEND_PLACEHOLDER/g, sonarBackendProject)
    .replace(/SONAR_FRONTEND_PLACEHOLDER/g, sonarFrontendProject)
    .replace(/STATUS_ICON_CLASS_PLACEHOLDER/g, statusIcon || 'fa-shield-halved')
    .replace(/HISTORY_DATA_PLACEHOLDER/g, JSON.stringify(historyData));
    
  fs.writeFileSync(path.join(reportsDir, 'index.html'), htmlContent, 'utf8');
  console.log('Dashboard index.html generated successfully.');
} else {
  console.error('CRITICAL: dashboard-template.html not found!');
}

// 11. COMPILE MANAGEMENT MARKDOWN REPORT
console.log('Generating latest.md Markdown Report...');
const mdReport = `# ${reportTitle}

**Report Date**: ${reportDateTime}  
**Scan Target**: ${scanTarget}  
**Report Type**: Executive Summary & Action Hub  

---

## 📊 Executive Summary

This security and operational report provides an aggregated overview of **${appName}**. It consolidates vulnerability scanning, compliance metrics, deep health checks, and test coverage into a unified management review.

### Status Assessment

**${securityStatus}**  
*${statusDesc}*  

- **Current Risk Score**: \`${riskScore}/100\` *(Lower is better)*
- **Remediation Debt Estimate**: \`${remediationDebt} hours\` of targeted security effort.
- **Business Criticality**: \`${config.businessCriticality}\`

---

## 📈 Security Posture & Vulnerabilities

| Scan Origin | Critical | High | Medium | Low/Info | Active Findings |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **ZAP Penetration Test** | ${zapMetrics.critical} | ${zapMetrics.high} | ${zapMetrics.medium} | ${zapMetrics.low + zapMetrics.info} | **${zapMetrics.total}** |
| **Nuclei Scanning** | ${nucleiMetrics.critical} | ${nucleiMetrics.high} | ${nucleiMetrics.medium} | ${nucleiMetrics.low + nucleiMetrics.info} | **${nucleiMetrics.total}** |
| **GitHub Code Scanning** | ${codeScanMetrics.critical} | ${codeScanMetrics.high} | ${codeScanMetrics.medium} | - | **${codeScanMetrics.open}** |
| **Dependabot Alerts** | - | - | - | - | **${dependabotCount}** |

> **ZAP Accepted Alerts**: \`${zapMetrics.ignored} alerts\` have been analyzed and accepted as low-risk in \`tests/.zap/rules.tsv\`. 
> 
> *Full scanning trace and historical remediations are tracked directly under the [GitHub Repository Security Dashboard](https://github.com/${repo}/security).*

---

## 🚀 DevOps Maturity & Stability Metrics

Measure of deployments, automation stability, and release velocity:

- **Deployment Frequency (Last 30 Days)**: \`${deploymentMetrics.frequency} deployments\`
- **Pipeline Deployment Success Rate**: \`${deploymentMetrics.successRate}%\`
- **Mean Time to Recovery (MTTR)**: \`${deploymentMetrics.mttr}\`
- **Vulnerability Remediation Velocity (Resolution Rate)**: \`${codeScanMetrics.resolutionRate}%\`
- **Last Successful Production Deployment**: \`${deploymentMetrics.lastTimestamp}\`

---

## ⚡ Application Performance & Infrastructure Latency

Continuous synthetic monitoring of backend dependencies and response latency:

- **Overall Deep Health Check**: \`${healthMetrics.overallStatus}\`
- **Health Check Round-trip Latency**: \`${healthMetrics.healthLatencyMs}\`
- **CHES (Email Client Services)**: \`${healthMetrics.chesLatency}\`
- **Object Storage (S3 / MinIO)**: \`${healthMetrics.s3Latency}\`
- **Cognito Federated Authentication**: \`${healthMetrics.cognitoLatency}\`

---

## 📝 Code Quality & Maintainability

Quality metrics extracted from static analysis and dependency trees:

- **Backend Test Coverage**: \`${backendCoverage}\` (Threshold: \`70%\`)
- **Frontend Test Coverage**: \`${frontendCoverage}\` (Threshold: \`70%\`)
- **Backend Outdated Packages**: \`${backendOutdated} packages\`
- **Frontend Outdated Packages**: \`${frontendOutdated} packages\`

---

## 🛠️ Prioritized Remediation Action Items

${criticalTotal > 0 ? `1. **🔴 IMMEDIATE REMEDIATION (0-7 days)**: Resolve the ${criticalTotal} critical vulnerabilities discovered in current active scans.` : '1. ✅ **No Critical Vulnerabilities**: No critical vulnerabilities require immediate action.'}
${highTotal > 0 ? `2. **🟠 URGENT REMEDIATION (7-30 days)**: Resolve the ${highTotal} high-risk findings within 30 days.` : '2. ✅ **No High Vulnerabilities**: No high-risk items requiring active maintenance.'}
${mediumTotal > 0 ? `3. **🟡 PLAN REMEDIATION (30-90 days)**: Plan the remediation of ${mediumTotal} medium-severity vulnerabilities as part of regular backlog sprint cycles.` : '3. ✅ **No Medium Vulnerabilities**: Medium items are in order.'}

---
*Report automatically compiled by the security reporting engine.*  
*Full audit archive and history lines: [GitHub Pages Security Dashboard](https://github.com/${repo}/reports/)*
`;

fs.writeFileSync(path.join(reportsDir, 'latest.md'), mdReport, 'utf8');
console.log('Markdown Report generated successfully.');

// 12. COMPILE HTML DETAIL REPORT FROM MARKDOWN (Using fallback if pandoc is missing)
console.log('Generating latest.html Detail HTML Report...');
const latestHtmlFile = path.join(reportsDir, 'latest.html');

let htmlReportContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${reportTitle}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown.min.css">
  <style>
    body {
      box-sizing: border-box;
      min-width: 200px;
      max-width: 980px;
      margin: 0 auto;
      padding: 45px;
      background-color: #0f172a;
      color: #cbd5e1;
    }
    .markdown-body {
      background-color: transparent !important;
      color: #cbd5e1 !important;
    }
    .markdown-body table tr {
      background-color: rgba(30, 41, 59, 0.5) !important;
      border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
    }
    .markdown-body table td, .markdown-body table th {
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }
    .markdown-body blockquote {
      color: #94a3b8 !important;
      border-left: .25em solid #6366f1 !important;
    }
    .markdown-body h1, .markdown-body h2 {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
    }
    .back-btn {
      display: inline-block;
      margin-bottom: 2rem;
      color: #6366f1;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <a href="index.html" class="back-btn">← Back to Security Dashboard</a>
  <article class="markdown-body">
    <!-- MARKDOWN_CONTENT_GOES_HERE -->
  </article>
</body>
</html>
`;

try {
  // Let's generate a quick HTML layout from our markdown
  // If pandoc is installed in runner, we'll try to use it, else parse a quick markdown-to-html
  let bodyHtml = '';
  try {
    runCmd(`pandoc --version`);
    bodyHtml = execSync(`pandoc -f markdown -t html`, { input: mdReport, encoding: 'utf8' });
  } catch (err) {
    // Basic native markdown parsing fallback for tags, tables, headers, and bullet points
    let parsed = mdReport;
    
    // Escape HTML first
    parsed = parsed
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
      
    // Quick and dirty parser for essential styling
    parsed = parsed
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^\*\* (.*$)/gim, '<strong>$1</strong>')
      .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
      .replace(/<\/ul>\s*<ul>/g, '')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
      .replace(/---\s*$/gim, '<hr>');

    // Basic Table Parser
    const lines = parsed.split('\n');
    let inTable = false;
    let tableHtml = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableHtml = '<table>';
        }
        
        const cols = line.split('|').slice(1, -1).map(c => c.trim());
        const isHeader = i < lines.length - 1 && lines[i+1].trim().includes('---');
        const isSeparator = line.includes('---');
        
        if (isSeparator) {
          continue;
        }
        
        tableHtml += '<tr>';
        cols.forEach(col => {
          tableHtml += isHeader ? `<th>${col}</th>` : `<td>${col}</td>`;
        });
        tableHtml += '</tr>';
      } else {
        if (inTable) {
          inTable = false;
          tableHtml += '</table>';
          lines[i] = tableHtml + '\n' + lines[i];
          tableHtml = '';
        }
      }
    }
    bodyHtml = lines.join('\n');
  }
  
  htmlReportContent = htmlReportContent.replace('<!-- MARKDOWN_CONTENT_GOES_HERE -->', bodyHtml);
  fs.writeFileSync(latestHtmlFile, htmlReportContent, 'utf8');
  console.log('HTML Detailed Report compiled successfully.');
} catch (e) {
  console.error('Failed to compile HTML detailed report.', e);
}

// 13. GENERATE ARCHIVE COPIES
console.log('Generating Archive Snapshots...');
const archiveDir = path.join(reportsDir, 'archive');
if (!fs.existsSync(archiveDir)) {
  fs.mkdirSync(archiveDir, { recursive: true });
}

fs.copyFileSync(latestHtmlFile, path.join(archiveDir, `${reportDateStr}.html`));
fs.copyFileSync(path.join(reportsDir, 'latest.md'), path.join(archiveDir, `${reportDateStr}.md`));
console.log(`Snapshots created: ${reportDateStr}.html and ${reportDateStr}.md`);

console.log('All security scans reports generated successfully!');
