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

# Architecture & Network Topology

## Network Security

The application follows a defense-in-depth approach with restricted network access:

### Production Deployment (OpenShift)

- **Frontend (Caddy)**: Publicly accessible via OpenShift Route
  - Serves static React application
  - Acts as a reverse proxy for backend API calls
  - All backend requests from the browser go through the frontend proxy (e.g., `/api/*`)
  
- **Backend (Node.js)**: Internal-only access
  - No public Route exposed
  - Only accessible from within the OpenShift namespace
  - Frontend Caddy proxy forwards requests to backend Service using internal cluster DNS
  - Network policies ensure pod-to-pod communication is allowed within the namespace

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

After cloning the repository install dependencies separately for the frontend and backend:

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

### Frontend

- `VITE_USER_POOLS_WEB_CLIENT_ID` (required) - Cognito web client ID (obtain from team secrets/vault)

**Optional with defaults:**
- `VITE_MAIN_VERSION` (defaults to 1.0.0)
- `VITE_COGNITO_REGION` (defaults to ca-central-1)
- `VITE_USER_POOLS_ID` (defaults to ca-central-1_t2HSZBHur)
- `VITE_AWS_DOMAIN` (defaults to prod-fam-user-pool-domain.auth.ca-central-1.amazoncognito.com)
- `VITE_ZONE` (defaults to DEV)

**Note**: `VITE_BACKEND_URL` is no longer required. The frontend uses relative URLs (e.g., `/api/*`) which are proxied by Caddy to the backend service.

### Backend

- `CHES_CLIENT_SECRET` (required)
- `S3_SECRETKEY` (required)

Other backend variables like `CHES_CLIENT_ID`, `S3_ACCESSKEY`, etc. have sensible defaults for development but can be overridden if needed.

## Docker Compose

This project includes Docker Compose configuration for local development. Docker Compose runs both the backend and frontend services together.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed
- Environment variables exported in your shell (see below)

### Quick Start

1. **Export required environment variables:**
   ```bash
   # Required secrets
   export CHES_CLIENT_SECRET="your-secret-here"
   export S3_SECRETKEY="your-s3-secret-here"
   export VITE_USER_POOLS_WEB_CLIENT_ID="your-client-id"
   ```

2. **Start the services:**
   ```bash
   # Start backend only (recommended for most development)
   docker compose up backend
   
   # Start backend + frontend dev server
   docker compose --profile frontend up
   
   # Start backend + Caddy (production-like, with proxying)
   docker compose --profile caddy up
   ```

3. **Stop services:**
   ```bash
   docker compose down
   ```

### Running with Docker Compose

**Backend only** (most common for frontend developers):
```bash
docker compose up backend
# Backend will be available at http://localhost:5000
# Then run frontend separately with: cd frontend && npm start
```

**Frontend development server:**
```bash
docker compose --profile frontend up
# Frontend dev server at http://localhost:3000
# Note: API calls need to go directly to backend at :5000 or use Caddy profile
```

**Caddy (production-like setup):**
```bash
docker compose --profile caddy up
# Caddy serves built frontend and proxies API calls to backend
# Access at http://localhost:3000
# API calls to /api/* are automatically proxied to backend
```

### Required Environment Variables

The following environment variables must be set before running Docker Compose. **Export these in your shell and do NOT commit them to any files.**

**Required Secrets:**
- `CHES_CLIENT_SECRET` - CHES email service client secret
- `S3_SECRETKEY` - S3 object storage secret key
- `VITE_USER_POOLS_WEB_CLIENT_ID` - Cognito web client ID

**Optional Variables with Defaults:**
All other variables have sensible defaults for development:
- `VITE_MAIN_VERSION` (default: 1.0.0)
- `VITE_COGNITO_REGION` (default: ca-central-1)
- `VITE_USER_POOLS_ID` (default: ca-central-1_t2HSZBHur)
- `VITE_AWS_DOMAIN` (default: prod-fam-user-pool-domain.auth.ca-central-1.amazoncognito.com)
- `VITE_ZONE` (default: DEV)
- `CHES_CLIENT_ID`, `CHES_TOKEN_URL`, `S3_ACCESSKEY`, `S3_BUCKETNAME`, `S3_ENDPOINT` - Backend defaults

**Example:**
```bash
# Only need to export the required secrets
export CHES_CLIENT_SECRET="your-secret-here"
export S3_SECRETKEY="your-s3-secret-here"
export VITE_USER_POOLS_WEB_CLIENT_ID="your-client-id"

# Then run docker compose
docker compose up
```

### Available Services

- **backend** - Node.js backend API (port 5000)
  - Always runs when any profile is started
  - Accessible at http://localhost:5000
  - Runs `npm ci` and starts with hot reload on file changes
  
- **frontend** - React development server (port 3000)
  - Requires `--profile frontend` or `--profile dev`
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

- [Cookie Security](docs/COOKIE_SECURITY.md) - Details on cookie configuration, security attributes, and authentication
- [Security Headers](docs/SECURITY-HEADERS.md) - Information on HTTP security headers
- [COOP/COEP Implementation](docs/COOP-COEP-IMPLEMENTATION.md) - Cross-Origin isolation implementation
- [ZAP Accepted Alerts](docs/security/zap-accepted-alerts.md) - Documentation of accepted low-risk ZAP security scan alerts

## Getting help

As mentioned, we're here to help. Feel free to start a conversation
on Rocket chat, you can search for `@jazz.grewal`.
