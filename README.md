# FlowFitness Backend

Node.js + TypeScript backend API for FlowFitness group-classes booking platform.

## Prerequisites

- Node.js 20 or higher
- npm
- Docker (optional, for containerized deployment)

## Local Development

### Installation

```bash
npm ci
```

### Running the Server

**Development mode** (with hot reload):
```bash
npm run dev
```

**Production mode** (requires build first):
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

### Available Scripts

- `npm run dev` - Start development server with hot reload (tsx watch)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server (requires build first)
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint and fix issues
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

### Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Available variables:
- `PORT` - Server port (default: 3000)

### Testing the Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "flowfitness-backend"
}
```

## Docker

### Building the Docker Image

```bash
docker build -t flowfitness-backend .
```

### Running the Docker Container

```bash
# Run with default port (3000)
docker run -p 3000:3000 flowfitness-backend

# Run with custom port
docker run -p 8080:3000 -e PORT=3000 flowfitness-backend

# Run in detached mode
docker run -d -p 3000:3000 --name flowfitness-backend flowfitness-backend
```

### Testing the Containerized Application

```bash
# After starting the container, test the health endpoint
curl http://localhost:3000/health
```

### Docker Image Details

- **Base Image**: `node:20-alpine` (lightweight production image)
- **Multi-stage Build**: 
  - Builder stage: Installs all dependencies and builds TypeScript
  - Runtime stage: Only production dependencies, runs compiled code
- **Security**: Runs as non-root user (`nodejs`)
- **Health Check**: Built-in health check endpoint monitoring

## AWS Deployment

The application is configured for deployment to AWS ECS Fargate using GitHub Actions.

### Deployment Workflows

- **Staging Deployment** (`.github/workflows/deploy_staging.yml`): 
  - Triggers on push to `develop` branch
  - Deploys to ECS Fargate staging environment
  - Image tag: `staging-{GITHUB_SHA}`

- **Production Deployment** (`.github/workflows/deploy_production.yml`):
  - Triggers on tags matching `v*` (e.g., `v1.0.0`)
  - Deploys to ECS Fargate production environment
  - Image tag: Tag name (e.g., `v1.0.0`)

### AWS Resource Naming

Recommended AWS resource names:

- **ECR Repository**: `flowfitness-api`
- **ECS Cluster**: `flowfitness-cluster`
- **ECS Service (Staging)**: `flowfitness-api-staging-svc`
- **ECS Service (Production)**: `flowfitness-api-production-svc`

### Required GitHub Secrets

Configure the following secrets in GitHub repository/environment settings:

- `AWS_ROLE_ARN` - IAM role ARN for OIDC authentication
- `AWS_REGION` - AWS region (e.g., `us-east-1`)
- `ECR_REPOSITORY` - ECR repository name (`flowfitness-api`)
- `ECS_CLUSTER` - ECS cluster name (`flowfitness-cluster`)
- `ECS_SERVICE` - ECS service name (staging: `flowfitness-api-staging-svc`, production: `flowfitness-api-production-svc`)

### Documentation

For detailed AWS deployment setup instructions, see [docs/AWS_DEPLOYMENT.md](./docs/AWS_DEPLOYMENT.md).

## GitFlow Overview

This project follows GitFlow branching strategy:

### Branches

- **`main`** - Production-ready code
- **`develop`** - Integration branch for features
- **`feature/*`** - Feature development branches
- **`release/*`** - Release preparation branches
- **`hotfix/*`** - Critical production fixes

### Releases and Tags

- Production releases are tagged with semantic versioning: `v*` (e.g., `v1.0.0`)
- Tags trigger production deployment workflows
- See [GITFLOW.md](./GITFLOW.md) for detailed workflow examples

## CI Overview

### PR Checks

GitHub Actions automatically runs checks on pull requests to `main` or `develop`:

- **Lint** - ESLint validation
- **Test** - Jest test suite

All checks must pass before a PR can be merged.

### Workflows

- `.github/workflows/pr-checks.yml` - Runs on PRs to `main`/`develop`
- `.github/workflows/deploy_staging.yml` - Deploys to staging on push to `develop` (ECS Fargate)
- `.github/workflows/deploy_production.yml` - Deploys to production on tag `v*` (ECS Fargate)

## Project Structure

```
flowfitness-backend/
├── .github/
│   └── workflows/     # GitHub Actions workflows
├── src/
│   ├── __tests__/     # Test files
│   └── index.ts       # Entry point
├── dist/              # Compiled JavaScript (generated)
├── docs/              # Documentation
│   └── AWS_DEPLOYMENT.md
├── ecs/               # ECS task definitions
│   ├── taskdef-staging.json
│   └── taskdef-prod.json
├── .dockerignore      # Docker ignore patterns
├── .eslintrc.js       # ESLint configuration
├── .prettierrc        # Prettier configuration
├── .editorconfig      # Editor configuration
├── .env.example       # Environment variables template
├── .gitignore
├── Dockerfile         # Multi-stage Docker configuration
├── jest.config.js     # Jest test configuration
├── package.json
├── tsconfig.json      # TypeScript configuration
├── GITFLOW.md         # GitFlow branching documentation
├── CONTRIBUTING.md    # Contribution guidelines
└── README.md
```

## Notes

- This is a minimal TypeScript backend scaffold
- Business features will be implemented incrementally
- No real secrets should be committed. Use `.env.example` as a template.
