# Testing the Workflow Failure Notification System

This document explains how to test and validate the workflow failure notification system.

## Overview

The notification system is designed to automatically create GitHub issues or PR comments when workflows fail. Since we can't easily trigger actual workflow failures in a proof of concept, this document outlines the expected behavior and testing approach.

## Expected Behavior

### For PR Validation Failures (`pr-validate.yml`)

**Scenario**: A PR validation workflow fails (e.g., deployment failure, smoke test failure)

**Expected Notification**:
1. A GitHub issue is created with title: "⚠️ PR Validation Failure - PR Validate"
2. The issue includes:
   - Link to the failed workflow run
   - Timestamp of the failure
   - Priority: medium
   - Labels: `bug`, `ci/cd`
   - Maintainers tagged (from CODEOWNERS)
3. If the same workflow fails again before the issue is closed, a comment is added to the existing issue instead of creating a new one

**Special Case - Renovate PRs**:
- If the PR is from Renovate (detected by PR author username matching "renovate*")
- A comment is added to the PR instead of creating an issue
- The comment includes the same information and tags maintainers

### For TEST Environment Failures (`merge.yml`)

**Scenario**: TEST deployment or smoke tests fail

**Expected Notification**:
1. A GitHub issue is created with title: "⚠️ TEST Deployment Failure - Merge (TEST)"
2. The issue includes:
   - Link to the failed workflow run
   - Timestamp of the failure
   - Priority: high
   - Labels: `bug`, `ci/cd`
   - Maintainers tagged

### For PROD Environment Failures (`merge.yml`)

**Scenario**: PROD deployment or smoke tests fail

**Expected Notification**:
1. A GitHub issue is created with title: "🚨 PROD Deployment Failure - Merge (PROD)"
2. The issue includes:
   - Link to the failed workflow run
   - Timestamp of the failure
   - Priority: **critical**
   - Labels: `bug`, `production`, `ci/cd`
   - Maintainers tagged
   - This is the highest priority notification requiring immediate attention

## Testing Strategies

### 1. Manual Testing (Recommended for POC)

Since this is a proof of concept, the best approach is to observe the system in action when real failures occur:

1. **Monitor Renovate PRs**: When Renovate creates a PR that fails validation
   - Expected: Comment on the PR with failure details
   - Verify: Maintainers are tagged, link to workflow run is included

2. **Monitor Merge Failures**: If a merge to main triggers deployment issues
   - Expected: Issue created with appropriate priority level
   - Verify: Issue includes all required information

3. **Check Issue Deduplication**: If the same workflow fails multiple times
   - Expected: Existing issue is updated with a new comment
   - Verify: No duplicate issues are created

### 2. Simulated Testing (Optional)

To test the notification system without waiting for real failures:

#### Option A: Temporarily Modify a Workflow to Fail

1. Create a test branch
2. Modify a workflow step to fail (e.g., add `exit 1` in a test step)
3. Open a PR with this change
4. Observe the notification when the workflow fails
5. Revert the change

**Example modification to `pr-validate.yml`**:
```yaml
- name: Test notification (temporary)
  run: |
    echo "This step will fail to test notifications"
    exit 1
```

#### Option B: Use workflow_dispatch for Manual Trigger

Add a manual workflow that intentionally fails to test notifications:

```yaml
name: Test Notifications
on:
  workflow_dispatch:

jobs:
  intentional-failure:
    runs-on: ubuntu-24.04
    steps:
      - run: exit 1
  
  notify:
    name: Test Notification
    if: always() && needs.intentional-failure.result == 'failure'
    needs: [intentional-failure]
    runs-on: ubuntu-24.04
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v5
      - uses: ./.github/actions/workflow-failed-notification
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          workflow-name: Test Notifications
          run-id: ${{ github.run_id }}
          run-url: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
          failure-type: general
```

### 3. Component Testing

Test individual parts of the notification action:

#### Test CODEOWNERS Parsing
```bash
# From repository root
grep -E '^[^#]' .github/codeowners | grep -oE '@[a-zA-Z0-9_-]+' | sort -u
```

Expected output: List of maintainer GitHub handles (e.g., `@DerekRoberts`)

#### Test Renovate Detection Logic
The action checks if `github.event.pull_request.user.login` matches "renovate*"
- This can be verified by inspecting Renovate PRs in the repository

## Validation Checklist

After deploying this notification system, verify:

- [ ] CODEOWNERS file contains valid GitHub usernames
- [ ] Workflow permissions include `issues: write` and `pull-requests: write`
- [ ] The notification action is properly referenced in workflows
- [ ] Notifications include all required information (workflow name, run URL, timestamp)
- [ ] Priority levels are correctly assigned based on failure type
- [ ] Issue deduplication works (repeated failures update existing issues)
- [ ] Renovate PRs receive comments instead of creating issues
- [ ] Maintainers receive GitHub notifications when tagged

## Monitoring Effectiveness

After deployment, monitor:

1. **Response Time**: How quickly maintainers respond to notifications
2. **False Positives**: Are notifications being created for expected failures?
3. **Issue Cleanup**: Are issues being closed after resolution?
4. **Notification Fatigue**: Are there too many notifications causing them to be ignored?

## Troubleshooting

### Issue: No notifications are created

**Possible causes**:
- Workflow doesn't have required permissions (`issues: write`, `pull-requests: write`)
- The notification step isn't being triggered (check `if:` conditions)
- GITHUB_TOKEN doesn't have sufficient permissions

**Solution**: Check workflow logs for errors in the notification step

### Issue: Duplicate issues are created

**Possible causes**:
- Issue search query doesn't match existing issues
- Issues were closed before new notification

**Solution**: Review the search logic in the action, verify issue titles match exactly

### Issue: Maintainers not tagged

**Possible causes**:
- CODEOWNERS file doesn't exist or has incorrect format
- Usernames in CODEOWNERS don't match actual GitHub usernames

**Solution**: Verify CODEOWNERS file format and usernames

## Future Enhancements

Potential improvements to consider:

1. **Metrics Dashboard**: Track failure patterns over time
2. **Custom Severity Levels**: Allow workflows to specify custom priority
3. **Slack Integration**: Optional Slack notifications for critical failures
4. **Auto-Remediation**: Automatically retry certain types of failures
5. **Notification Digest**: Weekly summary of all failures
6. **Escalation Policy**: Notify secondary contacts if primary doesn't respond

## Conclusion

This notification system provides a GitHub-native alternative to external webhooks like MS Teams. It leverages GitHub's built-in features to ensure maintainers are promptly notified of workflow failures with actionable information.

The proof of concept demonstrates the core functionality. Full validation will occur naturally as the system handles real workflow failures in production.
