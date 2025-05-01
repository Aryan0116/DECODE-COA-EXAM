
# Exam Platform - Git Workflow

This document outlines the Git workflow and branching strategy for the Exam Platform project.

## Repository Structure

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │     │               │
│    main       │────►│   staging     │────►│  feature      │────►│   bugfix      │
│               │     │               │     │   branches    │     │   branches    │
└───────────────┘     └───────────────┘     └───────────────┘     └───────────────┘
       │                     │                     │                     │
       │                     │                     │                     │
       ▼                     ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│               │     │               │     │               │     │               │
│  production   │     │     QA        │     │  development  │     │    hotfix     │
│  environment  │     │  environment  │     │  environment  │     │   branches    │
└───────────────┘     └───────────────┘     └───────────────┘     └───────────────┘
```

## Branching Strategy

### Main Branches

1. **main**: The production branch containing stable code that has been thoroughly tested and is ready for deployment.
2. **staging**: Pre-production branch for final testing before merging to main.
3. **develop**: The main development branch where features are integrated.

### Supporting Branches

1. **feature/\***: Feature branches for developing new functionality.
2. **bugfix/\***: Branches for fixing bugs identified during development.
3. **hotfix/\***: Branches for critical production fixes.
4. **release/\***: Branches for preparing releases.

## Commit Message Convention

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools

### Example:

```
feat(auth): implement teacher registration verification

Add verification code requirement for teacher registration.
Implement TEACH2025 as the verification code.

Resolves: #123
```

## Pull Request Process

1. Create a feature or bugfix branch from develop
2. Make changes and commit with appropriate messages
3. Push branch to remote repository
4. Create pull request to develop
5. Await code review
6. Make requested changes if any
7. Merge once approved

## Release Process

1. Create release branch from develop
2. Perform final testing and bug fixes
3. Update version number and changelog
4. Merge to staging for pre-production testing
5. Merge to main for production deployment
6. Tag the release with version number

## Continuous Integration

The project uses GitHub Actions for CI/CD:

1. **Build Check**: Triggered on every pull request to verify the build
2. **Test Suite**: Runs automated tests
3. **Linting**: Ensures code quality and consistent style
4. **Deployment**: Automatically deploys to the appropriate environment based on branch

## Issue Tracking

Issues are tracked in GitHub Issues with the following labels:

- **bug**: Something isn't working
- **feature**: New feature or request
- **documentation**: Improvements or additions to documentation
- **enhancement**: Improvement to existing functionality
- **help wanted**: Extra attention is needed
- **question**: Further information is requested
