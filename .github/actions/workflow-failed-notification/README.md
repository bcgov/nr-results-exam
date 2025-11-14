# Workflow Failure Notification Action

A GitHub-native workflow failure notification system that creates actionable alerts when workflows fail.

## Overview

This custom action provides an alternative to MS Teams webhooks by using GitHub's native features:
- **GitHub Issues** for tracking workflow failures
- **PR Comments** for Renovate dependency update failures
- **Maintainer Tagging** using CODEOWNERS file

## Features

✅ **Automatic Issue Creation** - Creates GitHub issues when workflows fail  
✅ **Issue Deduplication** - Updates existing issues instead of creating duplicates  
✅ **Renovate PR Support** - Comments directly on Renovate PRs  
✅ **Maintainer Notifications** - Auto-tags maintainers from CODEOWNERS  
✅ **Priority Levels** - Different severity for TEST vs PROD failures  
✅ **Failure Tracking** - Groups repeated failures in single issue  

## Usage

Add this action to your workflow's failure handling job:

```yaml
jobs:
  your-job:
    # ... your job steps ...

  notify-on-failure:
    name: Notify Failure
    if: always() && needs.your-job.result == 'failure'
    needs: [your-job]
    runs-on: ubuntu-24.04
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v5
      
      - name: Send notification
        uses: ./.github/actions/workflow-failed-notification
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          workflow-name: ${{ github.workflow }}
          run-id: ${{ github.run_id }}
          run-url: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
          failure-type: general  # or: pr-validation, merge-test, merge-prod
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `github-token` | Yes | - | GitHub token with `issues: write` and `pull-requests: write` permissions |
| `workflow-name` | Yes | - | Name of the workflow that failed |
| `run-id` | Yes | - | The workflow run ID (`${{ github.run_id }}`) |
| `run-url` | Yes | - | URL to the failed workflow run |
| `failure-type` | No | `general` | Type of failure: `pr-validation`, `merge-test`, `merge-prod`, `renovate`, or `general` |

## Failure Types

- **`pr-validation`** - PR validation failures (medium priority)
- **`merge-test`** - TEST environment deployment/smoke test failures (high priority)
- **`merge-prod`** - PROD environment failures (critical priority, immediate attention required)
- **`renovate`** - Automatically detected for Renovate bot PRs
- **`general`** - Default for other workflow failures

## Behavior

### For Renovate PRs
- Adds a comment to the PR with failure details
- Tags maintainers from CODEOWNERS
- Provides actionable next steps

### For Other Failures
- Creates a GitHub issue with descriptive title
- Searches for existing open issues to avoid duplicates
- Updates existing issues with new failures
- Tags maintainers for attention
- Adds appropriate labels based on failure type

## Permissions Required

The job using this action needs:

```yaml
permissions:
  issues: write           # To create/update issues
  pull-requests: write    # To comment on PRs
```

## Integration Points

This action is integrated with:
- `pr-validate.yml` - Notifies on PR validation failures
- `merge.yml` - Notifies on TEST and PROD deployment/smoke test failures

## Benefits Over MS Teams Webhooks

1. **Native GitHub Integration** - No external dependencies
2. **Traceable** - Issues provide audit trail
3. **Actionable** - Direct links to failed runs
4. **Contextual** - Comments on relevant PRs
5. **Maintained** - No webhook URL expiration concerns
6. **Searchable** - Easy to find and track recurring issues

## Example Notifications

### Issue Created for PROD Failure
```
Title: 🚨 PROD Deployment Failure - Merge

Workflow: Merge
Failure Type: merge-prod
Priority: critical
Latest Run: https://github.com/org/repo/actions/runs/12345
...
Attention Required: @maintainer1 @maintainer2
```

### Comment on Renovate PR
```
⚠️ Workflow Failed: PR Validate

Automated dependency update failed validation.
🔗 Failed Run: https://github.com/org/repo/actions/runs/12345
...
Maintainers: @maintainer1 @maintainer2
```

## Maintenance

The action automatically:
- Reads CODEOWNERS to find maintainers
- Detects Renovate PRs by author username
- Groups failures by workflow name
- Adds timestamps to all notifications
