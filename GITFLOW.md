# GitFlow Branching Strategy

This repository follows the GitFlow branching model for managing releases and features.

## Branch Structure

### Main Branches

- **`main`** - Production-ready code. Only contains code that has been released.
- **`develop`** - Integration branch for features. All feature branches merge here.

### Supporting Branches

- **`feature/*`** - Feature development branches
  - Branch from: `develop`
  - Merge back to: `develop`
  - Naming: `feature/feature-name` (e.g., `feature/user-authentication`)

- **`release/*`** - Release preparation branches
  - Branch from: `develop`
  - Merge back to: `develop` and `main`
  - Naming: `release/version` (e.g., `release/1.0.0`)
  - Used for final bug fixes and version bumping before production

- **`hotfix/*`** - Critical production fixes
  - Branch from: `main`
  - Merge back to: `main` and `develop`
  - Naming: `hotfix/issue-description` (e.g., `hotfix/security-patch`)

## Initial Setup

After cloning the repository, set up the initial branch structure:

```bash
# Create and switch to develop branch
git checkout -b develop
git push -u origin develop

# Ensure main branch exists and is protected
git checkout main
git push -u origin main
```

## Workflow Examples

### Starting a New Feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature
# ... make changes ...
git commit -m "Add feature implementation"
git push -u origin feature/my-new-feature
```

### Creating a Release

```bash
git checkout develop
git pull origin develop
git checkout -b release/1.0.0
# ... bump version, update changelog, fix bugs ...
git commit -m "Prepare release 1.0.0"
git push -u origin release/1.0.0
# After PR approval and merge, tag: git tag -a v1.0.0 -m "Release 1.0.0"
```

### Creating a Hotfix

```bash
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug
# ... fix the bug ...
git commit -m "Fix critical bug"
git push -u origin hotfix/critical-bug
# After PR approval, merge to main and develop
```

## Branch Protection Rules

Configure branch protection in GitHub for:
- `main`: Require PR reviews, require status checks to pass
- `develop`: Require status checks to pass (optional PR reviews)

## CI/CD Integration

- PRs to `develop` or `main` trigger: lint + test
- Pushes to `develop` trigger: staging deployment
- Tags matching `v*` trigger: production deployment

