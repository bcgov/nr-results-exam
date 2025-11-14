# Workflow Failure Notification Flow

This diagram illustrates how the notification system routes failures to the appropriate channels.

```
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflow                       │
│                    (pr-validate, merge, etc.)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Workflow Completes
                         ▼
                ┌────────────────────┐
                │  Did it succeed?   │
                └─────┬──────────┬───┘
                      │          │
              Yes ────┘          └──── No
              │                        │
              ▼                        ▼
        ┌──────────┐         ┌──────────────────────┐
        │   Done   │         │ Notification Job      │
        │    ✓     │         │ Triggers (if: always)│
        └──────────┘         └──────────┬───────────┘
                                        │
                                        ▼
                            ┌────────────────────────┐
                            │ Checkout Repository    │
                            │ Load Custom Action     │
                            └──────────┬─────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │  Read CODEOWNERS file        │
                        │  Extract maintainers         │
                        │  (e.g., @DerekRoberts)       │
                        └──────────┬───────────────────┘
                                   │
                                   ▼
                        ┌──────────────────────────────┐
                        │  Check: Is this a            │
                        │  Renovate PR?                │
                        └──────┬───────────────┬───────┘
                               │               │
                         Yes ──┘               └── No
                         │                         │
                         ▼                         ▼
            ┌────────────────────────┐   ┌──────────────────────────────┐
            │  Add Comment to PR     │   │  Check: Existing Issue?      │
            │                        │   └────┬─────────────────┬───────┘
            │  Content:              │        │                 │
            │  - Workflow failed     │   Yes ─┘                 └─── No
            │  - Link to run         │   │                          │
            │  - Tag maintainers     │   ▼                          ▼
            │  - Actionable steps    │ ┌──────────────┐  ┌──────────────────┐
            │                        │ │ Update Issue │  │ Create New Issue │
            └────────────────────────┘ │              │  │                  │
                                       │ Add comment: │  │ Priority based   │
                                       │ - New failure│  │ on failure type: │
                                       │ - Link       │  │                  │
                                       │ - Timestamp  │  │ • PROD: Critical │
                                       │ - Tag users  │  │ • TEST: High     │
                                       └──────────────┘  │ • PR: Medium     │
                                                         │                  │
                                                         │ Labels:          │
                                                         │ - bug            │
                                                         │ - ci/cd          │
                                                         │ - production (*)│
                                                         └──────────────────┘

Priority Levels:
  🚨 Critical  - PROD deployment/smoke test failures (immediate attention)
  ⚠️  High     - TEST deployment/smoke test failures (blocks pipeline)
  ⚠️  Medium   - PR validation failures (blocks PR merge)

Notification Destinations:
  📝 PR Comment   - Renovate dependency update failures
  🎫 GitHub Issue - All other workflow failures (deduplicated)
```

## Decision Tree

```
Workflow Failed
    │
    ├─ Is Renovate PR?
    │   ├─ Yes → Comment on PR + Tag maintainers
    │   └─ No  → Check for existing issue
    │             │
    │             ├─ Exists → Update issue with new failure
    │             └─ None   → Create new issue
    │                         │
    │                         ├─ PROD failure → Critical priority + production label
    │                         ├─ TEST failure → High priority
    │                         └─ PR failure   → Medium priority
    │
    └─ Tag maintainers from CODEOWNERS in all cases
```

## Example Flow: PROD Failure

1. **Merge to main** triggers `merge.yml` workflow
2. **PROD smoke tests fail** (job: `smoke-prod`)
3. **Notification job runs** (job: `notify-prod-failure`)
   - Condition: `if: always() && needs.smoke-prod.result == 'failure'`
4. **Custom action executes**:
   - Reads `.github/codeowners` → finds `@DerekRoberts`
   - Checks if Renovate PR → No (this is a merge to main)
   - Searches for existing issue with title "🚨 PROD Deployment Failure - Merge (PROD)"
   - No existing issue found → Creates new issue
5. **GitHub issue created**:
   - Title: "🚨 PROD Deployment Failure - Merge (PROD)"
   - Labels: `bug`, `production`, `ci/cd`
   - Body includes:
     - Priority: critical
     - Link to failed workflow run
     - Timestamp
     - Tag: @DerekRoberts
   - Next steps provided
6. **Maintainer notified**:
   - GitHub notification sent to @DerekRoberts
   - Email notification (if enabled in GitHub settings)
   - Issue appears in "Issues" tab

## Example Flow: Renovate PR Failure

1. **Renovate creates PR** for dependency update
2. **PR validation runs** via `pr-validate.yml`
3. **Validation fails** (job: `validate`)
4. **Notification job runs** (job: `results`)
   - Condition: `if: contains(needs.*.result, 'failure')`
5. **Custom action executes**:
   - Reads `.github/codeowners` → finds `@DerekRoberts`
   - Checks if Renovate PR → Yes (PR author is `renovate[bot]`)
   - Adds comment to PR instead of creating issue
6. **PR comment added**:
   - Title: "⚠️ Workflow Failed: PR Validate"
   - Content:
     - Automated dependency update failed
     - Link to failed run
     - Tag: @DerekRoberts
     - Actionable steps (fix, update, or close)
7. **Maintainer notified**:
   - GitHub notification for PR comment
   - Can review and respond directly on PR

## Key Design Decisions

1. **PR Comments for Renovate** - Keeps context with the dependency update
2. **Issue Deduplication** - Prevents spam from repeated failures
3. **Priority Levels** - PROD failures get immediate attention
4. **CODEOWNERS Integration** - Automatic maintainer discovery
5. **GitHub-Native** - No external dependencies or webhook management

## Advantages

- ✅ **Persistent** - Issues don't disappear like chat messages
- ✅ **Searchable** - Full GitHub search capabilities
- ✅ **Trackable** - Issues can be assigned, labeled, and tracked
- ✅ **Contextual** - All information in one place
- ✅ **Reliable** - No webhook expiration or external service dependencies
