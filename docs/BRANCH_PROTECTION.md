# Branch Protection Settings

This document outlines the branch protection requirements for the `main` branch, particularly in the context of maintenance mode and automated dependency updates via Renovate.

## Overview

The `main` branch is the primary production branch and requires strict protection rules to ensure code quality, security, and stability. These protections are especially important during maintenance mode when the repository receives primarily automated updates.

## Required Branch Protection Rules

### Status Checks

The following status checks **must pass** before merging to `main`:

- **PR Validate** workflow - This workflow validates pull requests by:
  - Deploying preview environments
  - Running validation checks
  - Ensuring PR quality standards are met

The PR Validate workflow is defined in `.github/workflows/pr-validate.yml` and is a critical gate for all changes.

### Protection Settings

The following settings should be configured on the `main` branch:

1. **Require pull request before merging**
   - At least 1 approval recommended
   - Dismiss stale pull request approvals when new commits are pushed (optional, based on team preference)

2. **Require status checks to pass before merging**
   - ✅ Require branches to be up to date before merging
   - Required status check: `Validate Results` (from PR Validate workflow)

3. **Restrict who can push to matching branches**
   - ✅ Block force pushes
   - ✅ Do not allow bypassing the above settings
   - This ensures even administrators and automated tools (like Renovate) must follow the merge process

4. **Additional Protections**
   - Require linear history (optional - prevents merge commits, enforces squash or rebase)
   - Require signed commits (optional - enhances security)

## Renovate Automerge Behavior

This repository uses [Renovate](https://docs.renovatebot.com/) for automated dependency updates with automerge enabled.

### Current Configuration

The repository extends `github>bcgov/renovate-config` which includes:
- `"automerge": true` - Renovate will attempt to automerge PRs
- `"platformAutomerge": true` - Uses GitHub's native automerge feature
- `"minimumReleaseAge": "7 days"` - Waits 7 days before upgrading to new versions
- `"schedule": ["before 6am every weekday"]` - Runs weekday mornings

### How Automerge Works with Branch Protection

When branch protection is properly configured:

1. **Renovate creates a PR** for dependency updates
2. **PR Validate workflow runs** automatically on the PR
3. **If all required checks pass**, GitHub's automerge feature will automatically merge the PR
4. **If checks fail**, the PR remains open and requires manual intervention
5. **Renovate cannot bypass** branch protection rules - it must wait for required checks

This ensures that even automated updates go through the same validation process as manual changes.

### Key Points

- ✅ Renovate **respects** branch protection rules
- ✅ PRs will **not merge** until `PR Validate` workflow succeeds
- ✅ Force pushes are **blocked** for all users including automation
- ✅ Bypass of merge requirements is **disabled**

## Maintenance Mode Expectations

During maintenance mode, the repository receives:
- Automated dependency updates from Renovate
- Security patches
- Critical bug fixes (as needed)

### Validation Process

All changes, including automated ones, must:
1. Pass the `PR Validate` workflow
2. Successfully deploy to preview environments
3. Pass any configured smoke tests or validation checks

### Monitoring

Repository maintainers should:
- Monitor Renovate PR status weekly
- Review any failed automerge attempts
- Investigate and resolve failing status checks
- Manually merge critical security updates if automerge fails

## Verification Checklist

To verify branch protection is correctly configured:

- [ ] Navigate to repository Settings → Branches
- [ ] Check `main` branch protection rules
- [ ] Verify "Require status checks to pass before merging" is enabled
- [ ] Confirm `Validate Results` is in the required status checks list
- [ ] Verify "Do not allow bypassing the above settings" is checked
- [ ] Verify "Allow force pushes" is disabled (unchecked)
- [ ] Test with a Renovate PR to confirm automerge waits for checks

## Updating Branch Protection

Branch protection rules can only be modified by repository administrators. To request changes:

1. Open an issue describing the needed change
2. Tag repository administrators
3. Provide justification for the change
4. Update this documentation after changes are applied

## Related Documentation

- [PR Validate Workflow](../.github/workflows/pr-validate.yml)
- [Renovate Configuration](../renovate.json)
- [Contributing Guide](../CONTRIBUTING.md)
- [Renovate Documentation](https://docs.renovatebot.com/)
