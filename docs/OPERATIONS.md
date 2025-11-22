# Operations Guide

## Maintenance Mode CI/CD Policy

### Overview

This repository is in **Stable/Maintenance Mode** as indicated by the lifecycle badge. The CI/CD pipeline is configured to ensure all changes, including infrastructure and workflow modifications, are properly tested and deployed even when active development has slowed.

## GitHub Environment Variables

### Overview

The deployment workflows use GitHub environment variables to configure URLs and hostnames for TEST and PROD environments. These variables allow for flexible URL configuration without modifying workflow code.

### Required Environment Variables

Configure these variables in GitHub repository settings under **Settings → Environments → [environment name] → Environment variables**:

#### Test Environment

Variable Name: `FRONTEND_URL`
- **Value**: `https://nr-results-exam-test-frontend.apps.silver.devops.gov.bc.ca/`
- **Description**: Full URL with protocol and trailing slash for the frontend application in TEST environment

Variable Name: `HOSTNAME`
- **Value**: `nr-results-exam-test-frontend.apps.silver.devops.gov.bc.ca`
- **Description**: Hostname without protocol for the OpenShift Route in TEST environment

Variable Name: `REDIRECT_FROM_URL`
- **Value**: `nr-results-exam-test.apps.silver.devops.gov.bc.ca`
- **Description**: Redirect from URL hostname (without protocol) for backward compatibility in TEST environment

#### Production Environment

Variable Name: `FRONTEND_URL`
- **Value**: `https://nr-results-exam-prod-frontend.apps.silver.devops.gov.bc.ca/`
- **Description**: Full URL with protocol and trailing slash for the frontend application in PROD environment

Variable Name: `HOSTNAME`
- **Value**: `nr-results-exam-prod-frontend.apps.silver.devops.gov.bc.ca`
- **Description**: Hostname without protocol for the OpenShift Route in PROD environment

Variable Name: `REDIRECT_FROM_URL`
- **Value**: `nr-results-exam-prod.apps.silver.devops.gov.bc.ca`
- **Description**: Redirect from URL hostname (without protocol) for backward compatibility in PROD environment

### Vanity URLs

For custom or vanity URLs in TEST/PROD environments:

1. Update the `FRONTEND_URL` variable to your custom URL (e.g., `https://results-exam.gov.bc.ca/`)
2. Update the `HOSTNAME` variable to match (e.g., `results-exam.gov.bc.ca`)
3. Configure DNS and OpenShift Route accordingly
4. Ensure trailing slash is included in `FRONTEND_URL`

### PR Deployments

PR deployments automatically calculate URLs based on the PR number:
- Formula: `PR_NUMBER % 50` to determine zone
- Frontend URL: `https://nr-results-exam-{ZONE}-frontend.apps.silver.devops.gov.bc.ca/`
- Redirect URL: `https://nr-results-exam-{ZONE}.apps.silver.devops.gov.bc.ca/`

No environment variables are needed for PR deployments as they are calculated in the workflow.

### Maintenance Mode Trigger Policy

#### Why Full Deploys Run on Workflow/Config Changes

The `merge.yml` workflow uses selective `paths-ignore` filters:

```yaml
paths-ignore:
  - "*.md"
  - ".github/**"
  - ".github/graphics/**"
  - "!.github/workflows/**"
```

**Key behaviors:**
- **Markdown files** (`*.md`) are ignored - documentation changes don't trigger deploys (see issue #428 if this policy changes)
- **Most `.github/` files** are ignored (issue templates, PR templates, graphics, etc.)
- **Workflow files** (`!.github/workflows/**`) are **NOT ignored** - the `!` prefix means these files will still trigger the workflow

**Rationale:**

In maintenance mode, workflow and CI/CD configuration changes are:
1. **Infrequent** - typically automated dependency updates from Renovate
2. **Critical** - they control the deployment pipeline itself and must be validated
3. **Low-cost to test** - validating workflow changes in production is safer than skipping validation

Running full deploys ensures that:
- Changes to GitHub Actions workflows are tested in the actual deployment environment
- Pipeline modifications (e.g., security updates, new action versions) work as expected
- The deployment process remains reliable even with minimal maintenance activity

### Difference from Active Development Teams

**Active Development Projects** can use more aggressive `paths-ignore` filters:
- May ignore `.github/workflows/**` changes if workflows are stable
- Can rely on frequent deployments to catch issues
- Have dedicated team members actively monitoring CI/CD

**Maintenance Mode Projects** need conservative filters because:
- Changes are rare, often automated (Renovate)
- No dedicated team actively monitoring for subtle pipeline issues
- Must validate that automated updates don't break the deployment process
- The cost of a broken pipeline is higher when there's no active team to quickly fix it

### When to Adjust `paths-ignore`

Consider modifying `paths-ignore` filters when:

**Adding ignores (more restrictive):**
- You have specific documentation or assets that change frequently
- You want to exclude non-code files that don't affect application behavior
- Example: Adding `- "docs/archive/**"` to ignore archived documentation

**Removing ignores (less restrictive):**
- A previously ignored path now affects deployments
- You need to test infrastructure-as-code changes
- You're transitioning out of maintenance mode to active development

**Never ignore without careful consideration:**
- Application source code directories (`backend/`, `frontend/`, `common/`)
- OpenShift deployment configurations
- Docker/container configurations
- Environment variable or secret configurations
- Test files that validate deployment health

### Renovate Automerge Configuration

This project extends `github>bcgov/renovate-config` which provides:
- **Automatic dependency updates** for npm packages, GitHub Actions, and Docker images
- **Automerge capability** for updates (including majors) when required checks pass
- **Automated testing** via PR workflows before merge

**Expected behavior in maintenance mode:**

1. **Renovate creates PRs** for dependency updates automatically
2. **PR workflow runs** - builds, deploys to test environment, runs smoke tests
3. **Automerge may occur** if:
   - All checks pass (build, deploy, tests)
   - Update matches the shared config rules (including major updates)
   - No merge conflicts exist

4. **Merge to main triggers** the full deployment pipeline:
   - Despite being a workflow/config change (if updating GitHub Actions)
   - Ensures the updated dependencies work in production
   - Validates that automerged changes don't break deployments

**Why this matters:**
- Renovate may update GitHub Actions versions in workflows (including major releases)
- These updates are automerged if checks pass
- The `merge.yml` workflow must run to validate the updated actions work in the actual deployment environment
- Ignoring workflow files would skip this validation, risking broken deployments

### Related Configurations

**Workflow files:**
- `.github/workflows/merge.yml` - Main deployment pipeline with `paths-ignore` configuration
- `.github/workflows/pr-open.yml` - PR validation (no path filters, tests all changes)

**Renovate configuration:**
- `renovate.json` - Extends bcgov preset with automerge capabilities

**Related issues and context:**
- Merge trigger configuration updates may be tracked in repository issues
- Renovate automerge behavior documented at: https://github.com/bcgov/renovate-config

### Best Practices

1. **Review Renovate PRs** even if automerge is enabled - especially for workflow changes
2. **Monitor deployment status** after automated merges to catch any issues early
3. **Keep `paths-ignore` minimal** in maintenance mode - err on the side of testing more
4. **Document exceptions** if you need to ignore additional paths
5. **Update this guide** when changing CI/CD behavior or transitioning project lifecycle stages

### Questions or Issues?

For questions about:
- **CI/CD pipeline**: Contact the DevOps team or repository maintainers
- **Renovate configuration**: See https://github.com/bcgov/renovate-config
- **Lifecycle stages**: See https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md
