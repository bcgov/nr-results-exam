# Workflow Failure Notification System - POC Summary

## Problem Statement
MS Teams webhooks for workflow failure notifications have not been successful. The team needs a reliable way to be notified when GitHub Actions workflows fail, especially for:
- Renovate PR validation failures
- TEST environment deployment issues
- PROD environment deployment issues (critical)

## Solution
Implemented a **GitHub-native notification system** using GitHub Issues and PR Comments instead of external webhooks.

## Key Features

✅ **No External Dependencies** - Uses only GitHub's native features  
✅ **Maintainer Tagging** - Automatically tags maintainers from CODEOWNERS file  
✅ **Smart Routing** - Renovate PRs get PR comments, other failures get issues  
✅ **Priority Levels** - PROD failures marked as critical, TEST as high, PR validation as medium  
✅ **Deduplication** - Updates existing issues instead of creating duplicates  
✅ **Actionable** - Direct links to failed workflow runs  

## How It Works

1. **Workflow Failure Detected** → Notification job runs
2. **Check Failure Type** → PR validation, TEST deploy, or PROD deploy
3. **Route Notification**:
   - **Renovate PR** → Comment on the PR
   - **Other failures** → Create/update GitHub issue
4. **Tag Maintainers** → Read from `.github/codeowners` file
5. **Provide Context** → Include workflow run link, timestamp, priority

## Integration Points

### PR Validation (`pr-validate.yml`)
- Triggers on: PR validation failures
- Creates: Medium priority issue or PR comment
- Tags: Maintainers from CODEOWNERS

### Merge Workflow (`merge.yml`)
Two separate notification jobs:
1. **TEST failures** → High priority issue
2. **PROD failures** → **Critical priority** issue (🚨 requires immediate attention)

## Benefits Over MS Teams Webhooks

| Feature | MS Teams Webhooks | GitHub Issues/Comments |
|---------|-------------------|------------------------|
| **Reliability** | Webhook URLs can expire | Native to GitHub |
| **Context** | Limited information | Full GitHub integration |
| **Tracking** | Messages disappear | Issues persist until resolved |
| **Searchability** | Limited | Full GitHub search |
| **Actionability** | Requires switching contexts | All info in one place |
| **Audit Trail** | Lost when messages scroll | Permanent record |
| **Team Changes** | Update webhook config | Update CODEOWNERS file |

## Example Notifications

### Issue Created for PROD Failure
```
Title: 🚨 PROD Deployment Failure - Merge (PROD)

Workflow: Merge
Failure Type: merge-prod
Priority: critical
Latest Run: https://github.com/bcgov/nr-results-exam/actions/runs/12345
Run ID: 12345
Time: 2025-11-14 19:30:00 UTC

Attention Required: @DerekRoberts

Recent Failures
| Time | Run | Status |
|------|-----|--------|
| 2025-11-14 19:30:00 | Run #12345 | ❌ Failed |

Labels: bug, production, ci/cd
```

### Comment on Renovate PR
```
⚠️ Workflow Failed: PR Validate

Automated dependency update failed validation.

🔗 Failed Run: https://github.com/bcgov/nr-results-exam/actions/runs/12345
📋 Workflow: PR Validate
⏰ Time: 2025-11-14 19:30:00 UTC

Maintainers: @DerekRoberts

Please review the failure and either:
- Fix the underlying issue
- Update dependencies to resolve conflicts
- Close this PR if the update is not compatible
```

## Files Changed

- `.github/actions/workflow-failed-notification/action.yml` - Custom action implementation
- `.github/actions/workflow-failed-notification/README.md` - Action documentation
- `.github/actions/workflow-failed-notification/TESTING.md` - Testing guide
- `.github/workflows/pr-validate.yml` - Added notification on failure
- `.github/workflows/merge.yml` - Added TEST and PROD failure notifications
- `README.md` - Updated monitoring section
- `docs/OPERATIONS.md` - Added workflow failure notification section

## Testing Approach

Since this is a proof of concept, full testing will occur naturally when:
1. A Renovate PR fails validation
2. A TEST deployment fails
3. A PROD deployment fails

The testing document (TESTING.md) provides strategies for manual testing if needed.

## Next Steps

1. **Monitor Real Failures** - Observe the system when actual workflow failures occur
2. **Gather Feedback** - Collect team feedback on notification quality
3. **Iterate** - Adjust priority levels, notification content, or routing as needed
4. **Consider Enhancements**:
   - Notification digest (weekly summary)
   - Escalation policy for unresolved critical issues
   - Metrics dashboard for failure patterns

## Rollback Plan

If the notification system doesn't work as expected:
1. Remove the notification jobs from workflows (revert workflow changes)
2. Keep the custom action in place for future use
3. The system is additive - removing it doesn't break existing functionality

## Questions?

For questions or issues:
- Review the documentation: `.github/actions/workflow-failed-notification/README.md`
- Check the testing guide: `.github/actions/workflow-failed-notification/TESTING.md`
- Contact: Repository maintainers listed in CODEOWNERS

---

**Status**: ✅ Proof of Concept Complete  
**Ready for**: Production testing with real workflow failures  
**Dependencies**: None (GitHub-native only)  
**Risk Level**: Low (additive feature, easy to disable)
