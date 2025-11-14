# Operations Guide

## Maintenance Mode CI/CD Policy

### Overview

This repository is in **Stable/Maintenance Mode** as indicated by the lifecycle badge. The CI/CD pipeline is configured to ensure all changes, including infrastructure and workflow modifications, are properly tested and deployed even when active development has slowed.

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

### Workflow Failure Notifications

The repository uses a GitHub-native notification system to alert maintainers when workflows fail. This system replaces MS Teams webhooks and provides better integration with GitHub's native features.

**How it works:**

1. **Automated Issue Creation**: When a workflow fails, a GitHub issue is automatically created with:
   - Descriptive title indicating the failure type (PR validation, TEST deployment, PROD deployment)
   - Direct link to the failed workflow run
   - Priority level (critical for PROD, high for TEST, medium for PR validation)
   - Automatic tagging of maintainers from the CODEOWNERS file
   - Appropriate labels for filtering and tracking

2. **Issue Deduplication**: The system searches for existing open issues with the same workflow failure and updates them rather than creating duplicates. This prevents notification spam and provides a single thread for tracking recurring failures.

3. **Renovate PR Comments**: When a Renovate dependency update PR fails validation:
   - A comment is added directly to the PR (no separate issue created)
   - Maintainers are tagged in the comment
   - Provides actionable next steps for resolving the failure

4. **Priority Escalation**: Different failure types receive different priority levels:
   - **PROD failures** (🚨): Critical priority - immediate attention required
   - **TEST failures** (⚠️): High priority - blocks deployment pipeline
   - **PR validation failures** (⚠️): Medium priority - blocks PR merge

**Configuration:**

The notification system is implemented as a reusable composite action at `.github/actions/workflow-failed-notification/`. It's integrated into:
- `pr-validate.yml` - Notifies on PR validation failures
- `merge.yml` - Separate notifications for TEST and PROD environment failures

**Maintainer Responsibilities:**

In maintenance mode, maintainers should:
1. **Monitor GitHub notifications** for workflow failure issues and PR comments
2. **Respond to critical PROD failures** within your team's SLA
3. **Review and address** TEST and PR validation failures to keep the pipeline healthy
4. **Close issues** once the underlying problem is resolved
5. **Update CODEOWNERS** if team membership changes to ensure correct notifications

For detailed documentation, see [Workflow Failure Notifications](./.github/actions/workflow-failed-notification/README.md).

### Questions or Issues?

For questions about:
- **CI/CD pipeline**: Contact the DevOps team or repository maintainers
- **Renovate configuration**: See https://github.com/bcgov/renovate-config
- **Lifecycle stages**: See https://github.com/bcgov/repomountie/blob/master/doc/lifecycle-badges.md
