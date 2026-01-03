# AWS Deployment Guide

This document describes the AWS resources and configuration required for deploying FlowFitness Backend to AWS ECS Fargate.

## Overview

The deployment uses:
- **Amazon ECR** (Elastic Container Registry) for Docker image storage
- **Amazon ECS** (Elastic Container Service) with Fargate for container orchestration
- **AWS IAM** with OIDC for GitHub Actions authentication
- **CloudWatch Logs** for container logging

## Required AWS Resources

### 1. Amazon ECR Repository

**Repository Name:** `flowfitness-api`

```bash
aws ecr create-repository \
  --repository-name flowfitness-api \
  --region us-east-1
```

**Note:** The repository URI will be in the format: `ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/flowfitness-api`

### 2. Amazon ECS Cluster

**Cluster Name:** `flowfitness-cluster`

```bash
aws ecs create-cluster \
  --cluster-name flowfitness-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
  --region us-east-1
```

### 3. Amazon ECS Service (Staging)

**Service Name:** `flowfitness-api-staging-svc`

**Prerequisites:**
- VPC with public subnets (or private subnets with NAT Gateway)
- Security group allowing inbound traffic on port 3000
- Application Load Balancer (optional, for public access)

**Create Service:**
```bash
aws ecs create-service \
  --cluster flowfitness-cluster \
  --service-name flowfitness-api-staging-svc \
  --task-definition flowfitness-api-staging \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --region us-east-1
```

### 4. Amazon ECS Service (Production)

**Service Name:** `flowfitness-api-production-svc`

Similar to staging, but with:
- Higher desired count (e.g., 2-3 tasks)
- Production-specific security groups
- Production load balancer target group

### 5. IAM Roles

#### ECS Task Execution Role

**Role Name:** `ecsTaskExecutionRole`

**Required Permissions:**
- `ecr:GetAuthorizationToken`
- `ecr:BatchCheckLayerAvailability`
- `ecr:GetDownloadUrlForLayer`
- `ecr:BatchGetImage`
- `logs:CreateLogStream`
- `logs:PutLogEvents`

**Trust Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

#### ECS Task Role

**Role Name:** `ecsTaskRole`

**Permissions:** Add permissions as needed for your application (e.g., S3, DynamoDB, etc.)

#### GitHub Actions OIDC Role

**Role Name:** `GitHubActionsDeployRole`

**Trust Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:bankarohit/flowfitness-backend:*"
        }
      }
    }
  ]
}
```

**Required Permissions:**
- `ecr:GetAuthorizationToken`
- `ecr:BatchCheckLayerAvailability`
- `ecr:GetDownloadUrlForLayer`
- `ecr:BatchGetImage`
- `ecr:PutImage`
- `ecr:InitiateLayerUpload`
- `ecr:UploadLayerPart`
- `ecr:CompleteLayerUpload`
- `ecs:DescribeServices`
- `ecs:UpdateService`
- `ecs:DescribeTaskDefinition`
- `ecs:RegisterTaskDefinition`
- `iam:PassRole` (for ECS task execution and task roles)

### 6. CloudWatch Log Groups

**Staging Log Group:** `/ecs/flowfitness-api-staging`
**Production Log Group:** `/ecs/flowfitness-api-production`

```bash
aws logs create-log-group \
  --log-group-name /ecs/flowfitness-api-staging \
  --region us-east-1

aws logs create-log-group \
  --log-group-name /ecs/flowfitness-api-production \
  --region us-east-1
```

## GitHub Secrets Configuration

Configure the following secrets in your GitHub repository settings:

### Repository Secrets

Go to: Settings → Secrets and variables → Actions → New repository secret

**Required Secrets:**

1. **AWS_ROLE_ARN**
   - Value: `arn:aws:iam::ACCOUNT_ID:role/GitHubActionsDeployRole`
   - Description: IAM role ARN for GitHub Actions OIDC authentication

2. **AWS_REGION**
   - Value: `us-east-1` (or your preferred region)
   - Description: AWS region for deployment

3. **ECR_REPOSITORY**
   - Value: `flowfitness-api`
   - Description: ECR repository name

4. **ECS_CLUSTER**
   - Value: `flowfitness-cluster`
   - Description: ECS cluster name

5. **ECS_SERVICE** (for staging)
   - Value: `flowfitness-api-staging-svc`
   - Description: ECS service name for staging

6. **ECS_SERVICE** (for production)
   - Value: `flowfitness-api-production-svc`
   - Description: ECS service name for production

**Note:** For production, you'll need to configure these secrets in the `production` environment, and for staging in the `staging` environment.

## GitHub Environments

Configure GitHub Environments for staging and production:

1. Go to: Settings → Environments
2. Create `staging` environment
3. Create `production` environment
4. Add the required secrets to each environment

## Environment Variables and Secrets

### Application Secrets

Store application secrets (database credentials, API keys, etc.) in:

- **AWS Systems Manager Parameter Store** (for non-sensitive config)
- **AWS Secrets Manager** (for sensitive secrets)

**Example:**
```bash
# Store in Secrets Manager
aws secretsmanager create-secret \
  --name flowfitness-api/staging/database \
  --secret-string '{"host":"db.example.com","username":"user","password":"pass"}'

# Reference in task definition (update taskdef JSON):
# "secrets": [
#   {
#     "name": "DATABASE_URL",
#     "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT_ID:secret:flowfitness-api/staging/database"
#   }
# ]
```

## Deployment Workflows

### Staging Deployment

- **Trigger:** Push to `develop` branch
- **Workflow:** `.github/workflows/deploy_staging.yml`
- **Image Tag:** `staging-{GITHUB_SHA}`
- **Task Definition:** `ecs/taskdef-staging.json`

### Production Deployment

- **Trigger:** Tag matching `v*` (e.g., `v1.0.0`)
- **Workflow:** `.github/workflows/deploy_production.yml`
- **Image Tag:** Tag name (e.g., `v1.0.0`)
- **Task Definition:** `ecs/taskdef-prod.json`

## Manual Deployment Steps

If you need to deploy manually:

```bash
# 1. Build and push image
docker build -t flowfitness-api:latest .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker tag flowfitness-api:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/flowfitness-api:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/flowfitness-api:latest

# 2. Update task definition with new image
# Edit ecs/taskdef-staging.json or ecs/taskdef-prod.json
# Replace ECR_REPOSITORY_URI:IMAGE_TAG with actual image URI

# 3. Register task definition
aws ecs register-task-definition \
  --cli-input-json file://ecs/taskdef-staging.json \
  --region us-east-1

# 4. Update service
aws ecs update-service \
  --cluster flowfitness-cluster \
  --service flowfitness-api-staging-svc \
  --task-definition flowfitness-api-staging \
  --force-new-deployment \
  --region us-east-1
```

## Troubleshooting

### Common Issues

1. **ECR Login Fails**
   - Verify IAM role has `ecr:GetAuthorizationToken` permission
   - Check AWS_REGION secret is correct

2. **ECS Service Update Fails**
   - Verify IAM role has `ecs:UpdateService` permission
   - Check service name and cluster name are correct
   - Ensure task definition is registered

3. **Task Fails to Start**
   - Check CloudWatch Logs for container errors
   - Verify security groups allow necessary traffic
   - Check task execution role has required permissions

4. **Health Check Fails**
   - Verify health check endpoint `/health` is accessible
   - Check container port mapping (3000)
   - Review health check configuration in task definition

## Cost Optimization

- Use **Fargate Spot** for staging environments (up to 70% savings)
- Right-size CPU and memory based on actual usage
- Enable CloudWatch Logs retention policies
- Use ECR lifecycle policies to clean up old images

## Security Best Practices

- Use OIDC for GitHub Actions (no long-lived credentials)
- Store secrets in AWS Secrets Manager
- Use least-privilege IAM policies
- Enable VPC flow logs
- Use security groups with minimal required ports
- Enable ECR image scanning

