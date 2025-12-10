[![License](https://img.shields.io/github/license/bcgov/nr-results-exam.svg)](/LICENSE.md)
[![Lifecycle:Stable](https://img.shields.io/badge/Lifecycle-Stable-97ca00)](https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md)
[![Merge](https://github.com/bcgov/nr-results-exam/actions/workflows/merge.yml/badge.svg)](https://github.com/bcgov/nr-results-exam/actions/workflows/merge-main.yml)
[![Analysis](https://github.com/bcgov/nr-results-exam/actions/workflows/analysis.yml/badge.svg)](https://github.com/bcgov/nr-results-exam/actions/workflows/analysis.yml)


<!-- ##### Frontend (JavaScript/TypeScript)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=bugs)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)
[![Duplicated Lines](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-frontend&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-frontend)

##### Backend (JavaScript/TypeScript)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=bugs)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=coverage)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)
[![Duplicated Lines](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=nr-results-exam-backend&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=nr-results-exam-backend) -->

# Natural Resources RESULTS Exam Web Application

This repository holds a set of policies, standard, guides and pipelines to get
started with a React TS Web Application.

## Our Policy

- Work in the open: That means that everything we do should be open, should be
  public. Please, don't create private repositories unless you have a very strong
  reason. Keeping things public is a must follow rule for BC Government.
- Customer centred services: All the work that's been created is to improve
  users, customers, and friends usability and experience. Is important to keep
  that in mind, because as engineers sometimes we face technical issues, however, our goal is to have a good product.
- Community based work: Remember that you're not alone. It's very likely that
  your problem is someone else's problem. Let's figure it out together. So, ask
  a question using our channels. We have [our own Stackoverflow](https://stackoverflow.developer.gov.bc.ca/)
  and [our Rocket Chat](https://chat.developer.gov.bc.ca/) channel.

## Maintenance Mode Automation

This repository operates in a low-dev (maintenance) mode where dependency updates
are fully automated:

- `renovate.json` extends [`bcgov/renovate-config`](https://github.com/bcgov/renovate-config),
  which enables Mend Renovate to group updates and automerge them—including major
  version bumps—once all required checks pass.
- GitHub branch protection on `main` requires the `PR Validate` workflow, so
  Renovate PRs can only merge after preview deployments and smoke tests succeed.
- If you ever need to pause automerge for a risky package, add a temporary
  `packageRules` block locally; otherwise defer to the upstream config to stay
  aligned with NRIDS best practices.

### Maintenance Mode Readiness Status

**Status: ✅ IN MAINTENANCE MODE**

This repository is operating in maintenance/sustainment mode as verified by the completion of [issue #229](https://github.com/bcgov/nr-results-exam/issues/229). All requirements have been met:

#### Test Coverage Status

**Backend Coverage:**
- Statements: **95.93%** (threshold: 70% ✅)
- Branches: **88.74%** (threshold: 70% ✅)
- Functions: **97.43%** (threshold: 70% ✅)
- Lines: **95.93%** (threshold: 70% ✅)
- **Status:** All metrics exceed thresholds

**Frontend Coverage:**
- Statements: **89.36%** (threshold: 70% ✅)
- Branches: **70.71%** (threshold: 70% ✅)
- Functions: **88.17%** (threshold: 70% ✅)
- Lines: **89.55%** (threshold: 70% ✅)
- **Status:** All metrics meet or exceed thresholds

**Test Suite:**
- 73 frontend tests (Vitest + React Testing Library)
- 65 backend tests (Node.js test runner)
- Integration smoke tests (health, API, frontend, security headers)
- Coverage thresholds enforced for both frontend and backend

#### Dependency Status

- ✅ No major version updates pending
- ✅ All dependencies are current or have only minor/patch updates available
- ✅ Current major versions are modern (Express 5, React 19, Vite 7)
- ✅ Renovate configured for automated dependency management

#### Verification Checklist

- ✅ Robust test suite, including integration tests
- ✅ Properly functioning PR environments
- ✅ Handling of deprecations (no critical deprecations found)
- ✅ Handling of outstanding updates (no major updates required)
- ✅ Linting configured and enforced (ESLint 9 for both frontend and backend)

**Renovate automerge will occur when:**
- All tests pass (including coverage thresholds)
- PR validation workflow succeeds
- Smoke tests pass
- No merge conflicts exist

### Runtime Health Checks

- `/health` now includes dependency probes for CHES, the S3/MinIO bucket, and Cognito (FAM).  
  The endpoint caches results for 60 seconds and returns `503` if any dependency reports `status: "error"`.
- Append `?deep=true` to force a live probe when troubleshooting (synthetic monitors can call the same URL).
- Responses list each dependency with `status`, latency, and bucket/endpoint metadata. The payload also exposes `lastCheckedAt` and `refreshInProgress` so operators know whether the values are cached.

### Automerge Expectations

**When Automerge Occurs:**
- Renovate creates PRs for dependency updates (npm packages, GitHub Actions, Docker images)
- All required status checks pass:
  - `Validate Results` - PR validation workflow
  - Preview deployment succeeds to OpenShift test environment
  - Smoke tests pass (health checks, basic functionality validation)
- No merge conflicts exist
- Updates are within the configured automerge policy (including major version bumps)

**When Manual Intervention is Needed:**
- Any required check fails (build errors, test failures, deployment issues)
- Merge conflicts with other pending PRs
- Security alerts flagged by Dependabot or scanning tools
- Breaking changes noted in package release notes that require code changes

**Automerge Timeline:**
- Renovate runs before 6am every weekday (configured schedule)
- New package versions wait 7 days before being proposed (stability period)
- PRs merge automatically after all checks pass (typically within minutes to hours)

### Smoke Test Coverage

The PR Validate workflow ensures changes are safe before automerge:

**Preview Deployment:**
- Deploys to OpenShift test environment (`pr-<number>` namespace)
- Backend API deployed and health-checked
- Frontend built and served via Caddy

**Automated Checks (current coverage):**
- Backend `/health` endpoint verification
- API root (`/api/`) success response
- Frontend build serves HTML with expected headers
- Security header enforcement (CSP, Permissions-Policy, HSTS, etc.)

> *Database connectivity and external service integrations are not part of the automated smoke suite today; run manual checks when changes affect those areas.*

**Manual Smoke Tests (When Required):**
For critical updates or when automated checks are insufficient:
- Navigate to preview URLs provided in PR comments
- Verify core user workflows function correctly
- Check authentication and authorization flows
- Validate data operations (create, read, update, delete)

### Operational Guardrails

**Branch Protection:**
- Force pushes blocked on `main`
- Required status checks cannot be bypassed
- At least 1 approval recommended for human-initiated PRs
- See [docs/BRANCH_PROTECTION.md](docs/BRANCH_PROTECTION.md) for complete settings

**Deployment Safeguards:**
- Workflow changes trigger full deployment validation (not ignored by `paths-ignore`)
- Failed deployments block automerge
- Rollback available via OpenShift deployment history
- Production deployments only occur after merge to `main`

**Monitoring:**
- GitHub Actions workflow status notifications
- Dependabot security alerts monitored
- OpenShift deployment status tracked
- Application health monitoring in production

### Periodic Manual Review Checklist

**Weekly (Automated via Renovate):**
- [x] Dependency update PRs created and processed
- [x] Automated checks run on all PRs
- [x] Successful updates automerge

**Monthly Review (Team Responsibility):**
- [ ] Review failed Renovate PRs and resolve blockers
- [ ] Check for stale or repeatedly failing dependency updates
- [ ] Verify production deployment health and logs
- [ ] Review security scan results (Dependabot, CodeQL, ZAP)
- [ ] Confirm no manual PRs are stuck or need attention

**Quarterly Review (Team Responsibility):**
- [ ] Review and update maintenance mode policy if needed
- [ ] Audit branch protection settings remain correct
- [ ] Validate Renovate configuration aligns with team standards
- [ ] Check for outdated dependencies with breaking changes
- [ ] Review application logs for recurring errors or warnings
- [ ] Test critical user workflows manually in production
- [ ] Update runbook/documentation for any new operational procedures

**Annual Review (Team Responsibility):**
- [ ] Comprehensive security audit of dependencies
- [ ] Review and update all operational documentation
- [ ] Validate disaster recovery and backup procedures
- [ ] Consider lifecycle stage (maintain as Stable or transition to Dormant)
- [ ] Update team contacts and escalation procedures
- [ ] Review and renew external service credentials/tokens

**Ad-Hoc (As Needed):**
- Major version updates that require code changes
- Security vulnerabilities requiring immediate patching
- Production incidents or outages
- Changes to external service dependencies
- Team structure or ownership changes

For detailed operational procedures, see:
- [Operations Guide](docs/OPERATIONS.md) - Maintenance mode CI/CD policy and trigger configuration
- [Branch Protection](docs/BRANCH_PROTECTION.md) - Branch protection settings and Renovate automerge details

# Stack

Here you will find a comprehensive list of all the languages and tools that are
been used in this app. And also everything you need to get started, build,
test and deploy.

- React Progressive Web Application
  - TypeScript
  - Context API
  - React Testing Library
  - Vitest
- Lint
  - Airbnb ESLint
- Tools
  - Docker
  - Microsoft Visual Studio Code
- Styling
  - Carbon Design System
  - Bootstrap
- Authentication
  - AWS Cognito (FAM)
- Web Application Firewall
  - [Coraza WAF](https://github.com/corazawaf/coraza-caddy) integrated with Caddy

### 🛡️ Coraza WAF: Customization & Troubleshooting

The Coraza Web Application Firewall (WAF) protects your application from common web threats. If you need to customize its behavior or troubleshoot blocked requests, follow these steps:

**1. Modifying WAF Rules**
- WAF rules are defined in `frontend/coraza.conf`.
- Edit this file to add, remove, or adjust rules. For example, to allow a specific request method, modify or comment out the relevant rule.
- After making changes, restart the frontend service (Caddy) to apply updates.

**2. Viewing WAF Logs**
- WAF logs are typically output to the Caddy logs. Check the container logs with:
  ```bash
  oc logs <pod-name> -n <namespace>
  ```
- Look for entries containing "coraza" or "WAF" to identify blocked requests and rule matches.

**3. Temporarily Disabling the WAF**
- To disable the WAF for testing, comment out or remove the Coraza configuration block in the Caddyfile (usually in `frontend/Caddyfile`). This ensures Caddy will start without referencing the missing configuration.
- Do **not** simply remove or rename `coraza.conf` without updating the Caddyfile, as this will cause Caddy to fail to start due to the `Include /etc/caddy/coraza.conf` directive.
- **Warning:** Disabling the WAF exposes your app to threats. Only do this in non-production environments.

**4. Handling False Positives & Whitelisting Legitimate Traffic**
- If legitimate requests are blocked, review the logs to identify which rule triggered the block.
- Adjust or disable the specific rule in `coraza.conf` to whitelist the traffic.
- You can use `SecRuleRemoveById <rule_id>` to disable a rule by its ID.
- Test thoroughly after making changes to ensure security is maintained.

For more details, see the [Coraza documentation](https://coraza.io/docs/).

# Architecture & Network Topology

## Network Security

The application follows a defense-in-depth approach with restricted network access:

### Production Deployment (OpenShift)

- **Frontend (Caddy)**: Publicly accessible via OpenShift Route
  - Serves static React application
  - Acts as a reverse proxy for backend API calls
  - All backend requests from the browser go through the frontend proxy (e.g., `/api/*`)
  - Protected by Coraza WAF for security threat detection and blocking
  
- **Backend (Node.js)**: Internal-only access
  - No public Route exposed
  - Only accessible from within the OpenShift namespace
  - Frontend Caddy proxy forwards requests to backend Service using internal cluster DNS
  - Network policies ensure pod-to-pod communication is allowed within the namespace

### URL Formats and Redirects

The application supports two URL formats for backward compatibility during transition:

- **Main URL** (with `-frontend` suffix): `*-<zone>-frontend.apps.silver.devops.gov.bc.ca`
  - This is the current primary URL format
  - All new deployments use this format
  - This URL serves the application normally

- **Redirect From URL** (without `-frontend` suffix): `*-<zone>.apps.silver.devops.gov.bc.ca`
  - This format is maintained for backward compatibility
  - Redirect from URLs automatically redirect (301 or 308) to the main URL format
  - Caddy returns a 301 (Moved Permanently) for GET/HEAD requests and a 308 (Permanent Redirect) for other HTTP methods, following standard behavior for permanent redirects
  - The redirect is handled by Caddy using a header matcher to ensure only redirect from URLs are redirected

**Note:** This redirect infrastructure is temporary and will be removed after the transition period is complete. The main URL format (with `-frontend`) should be used for all new integrations and bookmarks.

### Security Benefits

- **Reduced Attack Surface**: Backend is not directly reachable from the internet
- **Simplified CORS**: Browser requests originate from the same domain (frontend)
- **Network Policy Enforcement**: Kubernetes NetworkPolicies control traffic flow
- **Least Privilege**: Only necessary services are exposed externally
- **Proxy Header Validation**: Caddy sets the `X-Forwarded-By: caddy-proxy` header when proxying requests to the backend. The backend validates this header for defense-in-depth, protecting against accidental backend exposure or network policy misconfiguration.

### Network Policies

The deployment includes the following network policies:

1. **allow-from-openshift-ingress**: Allows traffic from OpenShift ingress controller to all pods (for Route access)
2. **allow-same-namespace**: Allows all pods within the namespace to communicate with each other (for frontend→backend communication)

# Getting started

After cloning the repository install dependencies separately for the frontend and backend.  
Use Node.js 24 to match CI/CD runners (an `.nvmrc` is provided for convenience):

```bash
nvm use
```

```bash
# Frontend
cd frontend
npm install
# Backend
cd ../backend
npm install
```

## Running locally

### Using npm scripts

```bash
# Frontend (served at http://localhost:3000)
cd frontend
npm run start

# Backend API (served at http://localhost:5000)
cd backend
npm start
```

### Running the unit test suites

```bash
# Frontend tests (Vitest + Testing Library)
cd frontend
npm run test

# Backend tests (node --test)
cd backend
npm test
```

## Required environment variables

Set these before running the apps or Docker Compose. Export values in your shell; do not commit them.

### Configuration Storage Pattern

**OpenShift Templates** are the primary source of truth for all configuration defaults. These defaults are:
- Visible in the codebase and git history
- Defined in `backend/openshift.deploy.yml` and `frontend/openshift.deploy.yml`
- Mirrored in `docker-compose.yml` for local development consistency

**Override Mechanism:**
- **Deployed environments**: GitHub environment variables can override template defaults when needed
- **Local development**: Shell environment variables can override docker-compose defaults
- **Empty/unset variables**: Template defaults are used automatically

### Backend

- `CHES_CLIENT_SECRET` (required) - Must be set, no default
- `S3_SECRETKEY` (required) - Must be set, no default

**Optional with defaults (defined in templates):**
- `CHES_CLIENT_ID` (default: `09C5071A-ACE9B6FACF6`)
- `CHES_TOKEN_URL` (default: `https://test.loginproxy.gov.bc.ca/auth/realms/comsvcauth/protocol/openid-connect/token`)
- `S3_ACCESSKEY` (default: `nr-fsa-tst`)
- `S3_BUCKETNAME` (default: `tivpth`)
- `S3_ENDPOINT` (default: `nrs.objectstore.gov.bc.ca`)
- `VITE_USER_POOLS_ID` (default: `ca-central-1_UpeAqsYt4`)
- `VITE_COGNITO_REGION` (default: `ca-central-1`)

### Frontend

> **Note**: Frontend variables are only required when running full-stack with Docker Compose (Caddy or frontend profiles). For backend-only development, these are not needed.

**Optional with defaults (defined in templates):**
- `VITE_USER_POOLS_WEB_CLIENT_ID` (default: `7k8j9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z`) - Can be overridden for environment-specific values
- `VITE_MAIN_VERSION` (default: `1.0.0`)
- `VITE_COGNITO_REGION` (default: `ca-central-1`)
- `VITE_USER_POOLS_ID` (default: `ca-central-1_UpeAqsYt4`) - Can be overridden via GitHub vars if needed
- `VITE_AWS_DOMAIN` (default: `lza-prod-fam-user-pool-domain.auth.ca-central-1.amazoncognito.com`) - Can be overridden via GitHub vars if needed
- `VITE_ZONE` (default: `DEV` for local, derived from deployment zone in OpenShift)

**Note**: `VITE_BACKEND_URL` is no longer required. The frontend uses relative URLs (e.g., `/api/*`) which are proxied by Caddy to the backend service.

## Docker Compose

This project includes Docker Compose configuration for local development. Docker Compose runs both the backend and frontend services together.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed
- Environment variables exported in your shell (see below)

### Quick Start

**For Backend-Only Development** (most common):
```bash
# Only backend secrets required
export CHES_CLIENT_SECRET="your-secret-here"
export S3_SECRETKEY="your-s3-secret-here"

# Start backend
docker compose up backend
# Backend will be available at http://localhost:5000
# Then run frontend locally: cd frontend && npm start
```

**For Full-Stack Development with Caddy** (production-like):
```bash
# All required secrets (backend + frontend)
export CHES_CLIENT_SECRET="your-secret-here"
export S3_SECRETKEY="your-s3-secret-here"
export VITE_USER_POOLS_WEB_CLIENT_ID="your-client-id"

# Start with Caddy proxy
docker compose --profile caddy up
# Access at http://localhost:3000
```

### Running with Docker Compose

**Backend only** (most common for frontend developers):
```bash
docker compose up backend
# Backend will be available at http://localhost:5000
# Then run frontend separately with: cd frontend && npm start
```

**Frontend development server (NOT RECOMMENDED):**
```bash
docker compose --profile frontend up
# Frontend dev server at http://localhost:3000
```

> **⚠️ Important**: API calls to `/api/*` will NOT work with this profile because the Vite dev server does not include a proxy configuration to forward requests to the backend.
> 
> **Recommended alternatives:**
> - Use the Caddy profile for full-stack development: `docker compose --profile caddy up`
> - Or run frontend locally outside Docker: `docker compose up backend` + `cd frontend && npm start`

**Caddy (production-like setup - RECOMMENDED for full-stack development):**
```bash
docker compose --profile caddy up
# Caddy serves built frontend and proxies API calls to backend
# Access at http://localhost:3000
# API calls to /api/* are automatically proxied to backend
```

### Required Environment Variables

The following environment variables must be set before running Docker Compose. **Export these in your shell and do NOT commit them to any files.**

**For Backend-Only Development:**
- `CHES_CLIENT_SECRET` - CHES email service client secret (no default, must be set)
- `S3_SECRETKEY` - S3 object storage secret key (no default, must be set)

**For Full-Stack Development (Caddy or Frontend profiles):**
- `CHES_CLIENT_SECRET` - CHES email service client secret (no default, must be set)
- `S3_SECRETKEY` - S3 object storage secret key (no default, must be set)
- `VITE_USER_POOLS_WEB_CLIENT_ID` - Cognito web client ID (has default in template, can be overridden)

**Optional Variables with Defaults:**
All other variables have sensible defaults defined in templates and mirrored in docker-compose.yml:
- `VITE_MAIN_VERSION` (default: 1.0.0)
- `VITE_COGNITO_REGION` (default: ca-central-1)
- `VITE_USER_POOLS_ID` (default: ca-central-1_UpeAqsYt4)
- `VITE_USER_POOLS_WEB_CLIENT_ID` (default: 7k8j9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z)
- `VITE_AWS_DOMAIN` (default: lza-prod-fam-user-pool-domain.auth.ca-central-1.amazoncognito.com)
- `VITE_ZONE` (default: DEV)
- `CHES_CLIENT_ID` (default: 09C5071A-ACE9B6FACF6)
- `CHES_TOKEN_URL` (default: https://test.loginproxy.gov.bc.ca/auth/realms/comsvcauth/protocol/openid-connect/token)
- `S3_ACCESSKEY` (default: nr-fsa-tst)
- `S3_BUCKETNAME` (default: tivpth)
- `S3_ENDPOINT` (default: nrs.objectstore.gov.bc.ca)
- `FRONTEND_URL` (default: http://localhost:3000)

### Available Services

- **backend** - Node.js backend API (port 5000)
  - Always runs when any profile is started
  - Accessible at http://localhost:5000
  - Runs `npm ci` and starts with hot reload on file changes
  
- **frontend** - React development server (port 3000)
  - Requires `--profile frontend`
  - Vite dev server with hot module replacement
  - Direct backend access needed (or use Caddy profile)
  
- **caddy** - Production-like server with Caddy (port 3000)
  - Requires `--profile caddy`
  - Builds frontend and serves with Caddy
  - Proxies `/api/*` and `/health` requests to backend
  - **Recommended for testing production-like setup**

### Development Workflow

**For frontend development:**
```bash
# Terminal 1: Start backend
docker compose up backend

# Terminal 2: Run frontend locally
cd frontend
npm install
npm start
```

> **Note:** When running the frontend locally and the backend in Docker, API requests from the frontend (e.g., to `/api/*`) must be proxied to the backend at `http://localhost:5000`.  
> To enable this, add the following proxy configuration to your `vite.config.ts`:
>
> ```ts
> // vite.config.ts
> import { defineConfig } from 'vite';
> 
> export default defineConfig({
>   server: {
>     proxy: {
>       '/api': 'http://localhost:5000',
>       '/health': 'http://localhost:5000'
>     }
>   }
> });
> ```
>
> This allows you to use relative URLs (e.g., `/api/foo`) in your frontend code, and Vite will forward them to the backend.  
> If you do not set up this proxy, you must use absolute URLs (e.g., `http://localhost:5000/api/foo`) in your frontend code for API requests to work.

**For testing production setup:**
```bash
# Single command starts everything
docker compose --profile caddy up
```

**For full-stack development with hot reload:**
```bash
docker compose --profile frontend up
# Both frontend and backend will reload on file changes
```

### Troubleshooting

**Containers won't start:**
- Check that all required environment variables are exported in your shell
- Run `docker compose config` to validate configuration and see resolved values
- Verify `docker compose config` shows your exported variables

**Port already in use:**
- Stop existing services: `docker compose down`
- Or change ports in `docker-compose.yml`

**Changes not reflected:**
- Rebuild containers: `docker compose up --build`
- Clear volumes: `docker compose down -v` (warning: removes node_modules)

Before writing your first line of code, please take a moment and check out
our [CONTRIBUTING](CONTRIBUTING.md) guide.

## Documentation

- [Branch Protection](docs/BRANCH_PROTECTION.md) - Branch protection settings and maintenance mode operations
- [Operations Guide](docs/OPERATIONS.md) - Maintenance mode CI/CD policy, trigger configuration, and Renovate automerge
- [Cookie Security](docs/COOKIE_SECURITY.md) - Details on cookie configuration, security attributes, and authentication
- [Security Headers](docs/SECURITY-HEADERS.md) - Information on HTTP security headers
- [COOP/COEP Implementation](docs/COOP-COEP-IMPLEMENTATION.md) - Cross-Origin isolation implementation
- [ZAP Accepted Alerts](docs/security/zap-accepted-alerts.md) - Documentation of accepted low-risk ZAP security scan alerts

## Getting help

As mentioned, we're here to help. Feel free to start a conversation
on Rocket chat, you can search for `@jazz.grewal`.
