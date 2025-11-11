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

Set these before running the apps or Docker Compose. Values can be exported in your shell; do not commit them.

### Frontend

- `VITE_MAIN_VERSION`
- `VITE_COGNITO_REGION`
- `VITE_USER_POOLS_ID`
- `VITE_USER_POOLS_WEB_CLIENT_ID`
- `VITE_AWS_DOMAIN`

**Note**: `VITE_BACKEND_URL` is no longer required. The frontend uses relative URLs (e.g., `/api/*`) which are proxied by Caddy to the backend service.

### Backend

- `CHES_CLIENT_SECRET`
- `S3_SECRETKEY`

## Docker Compose

This project includes Docker Compose configuration for local development. Docker Compose runs both the backend and frontend services together.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed
- Environment variables set (see below)

### Running with Docker Compose

Start all services:
```bash
docker compose up
```

Start specific services:
```bash
# Start only frontend
docker compose --profile frontend up frontend

# Start with Caddy (production-like server)
docker compose --profile caddy up caddy
```

Stop services:
```bash
docker compose down
```

### Required Environment Variables

The following environment variables must be set before running Docker Compose. **These should be set as local environment variables and should NOT be committed to `docker compose.yml`.**

**Backend:**
- `CHES_CLIENT_SECRET` - CHES email service client secret (obtain from team secrets/vault)
- `S3_SECRETKEY` - S3 object storage secret key (obtain from team secrets/vault)

**Frontend (Caddy profile only):**
- When using the Caddy profile, the `BACKEND_SERVICE_URL` is automatically set to `http://backend:5000` in docker-compose.yml

**Setting Environment Variables Locally:**

Set these variables in your shell before running docker compose:

```bash
# Set environment variables
export CHES_CLIENT_SECRET="your-secret-here"
export S3_SECRETKEY="your-s3-secret-here"

# Then run docker compose
docker compose up
```

### Available Services

- **backend** - Node.js backend API (port 5000)
  - Accessible at http://localhost:5000 when running in dev mode
- **frontend** - React development server (port 3000)
  - Connects directly to backend at http://localhost:5000
- **caddy** - Production-like server with Caddy (port 3000)
  - Proxies `/api/*` and `/health` requests to the backend service
  - Use this profile to test the production network topology locally

Before writing your first line of code, please take a moment and check out
our [CONTRIBUTING](CONTRIBUTING.md) guide.

## Getting help

As mentioned, we're here to help. Feel free to start a conversation
on Rocket chat, you can search for `@jazz.grewal`.
