# Contributing to FlowFitness Backend

Thank you for your interest in contributing to FlowFitness Backend!

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `npm ci`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### GitFlow

This project follows GitFlow branching strategy:

- Create feature branches from `develop`
- All feature work happens in `feature/*` branches
- Merge feature branches back to `develop` via pull request
- Releases are prepared in `release/*` branches
- Hotfixes are created from `main` in `hotfix/*` branches

See [GITFLOW.md](./GITFLOW.md) for detailed workflow examples.

### Code Standards

- **TypeScript**: All code must be written in TypeScript
- **Linting**: Run `npm run lint` before committing
- **Formatting**: Code is automatically formatted with Prettier
- **Testing**: Write tests for new features and ensure all tests pass

### Before Submitting a PR

1. Ensure all tests pass: `npm test`
2. Run linter: `npm run lint`
3. Build the project: `npm run build`
4. Update documentation if needed
5. Follow the PR template

### Commit Messages

Use clear, descriptive commit messages. Follow conventional commit format when possible:

- `feat: add new endpoint`
- `fix: resolve health check issue`
- `docs: update README`
- `test: add tests for health endpoint`

## Pull Request Process

1. Create a pull request targeting the `develop` branch
2. Fill out the PR template completely
3. Ensure all CI checks pass
4. Request review from maintainers
5. Address any feedback
6. Once approved, maintainers will merge your PR

## Questions?

If you have questions, please open an issue or contact the maintainers.

