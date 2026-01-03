# AWS Setup TODO List

This document tracks the manual AWS setup tasks required before deployments can work.

## AWS Infrastructure Setup

### 1. Amazon ECR Repository
- [ ] Create ECR repository: `flowfitness-api`
- [ ] Note the repository URI (format: `ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/flowfitness-api`)

**Command:**
```bash
aws ecr create-repository \
  --repository-name flowfitness-api \
  --region us-east-1
```

### 2. Amazon ECS Cluster
- [ ] Create ECS cluster: `flowfitness-cluster`
- [ ] Configure capacity providers (FARGATE, FARGATE_SPOT)

**Command:**
```bash
aws ecs create-cluster \
  --cluster-name flowfitness-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
  --region us-east-1
```

### 3. VPC and Networking
- [ ] Create VPC with subnets (public or private with NAT Gateway)
- [ ] Create security groups allowing inbound traffic on port 3000
- [ ] Note subnet IDs and security group IDs for ECS service configuration

### 4. ECS Services
- [ ] Create staging service: `flowfitness-api-staging-svc`
- [ ] Create production service: `flowfitness-api-production-svc`
- [ ] Configure services with task definitions (can use placeholders initially)

**Command (Staging):**
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

### 5. IAM Roles

#### ECS Task Execution Role
- [ ] Create `ecsTaskExecutionRole` with:
  - ECR permissions (GetAuthorizationToken, BatchCheckLayerAvailability, GetDownloadUrlForLayer, BatchGetImage)
  - CloudWatch Logs permissions (CreateLogStream, PutLogEvents)

#### ECS Task Role
- [ ] Create `ecsTaskRole` for application permissions (add as needed)

#### GitHub Actions OIDC Role
- [ ] Create OIDC provider for GitHub Actions (if not exists)
- [ ] Create `GitHubActionsDeployRole` with:
  - OIDC trust policy for `repo:bankarohit/flowfitness-backend:*`
  - ECR permissions (all push/pull operations)
  - ECS permissions (DescribeServices, UpdateService, DescribeTaskDefinition, RegisterTaskDefinition)
  - IAM PassRole permission (for ECS task roles)

**See [docs/AWS_DEPLOYMENT.md](./docs/AWS_DEPLOYMENT.md) for detailed IAM policies.**

### 6. CloudWatch Logs
- [ ] Create log group: `/ecs/flowfitness-api-staging`
- [ ] Create log group: `/ecs/flowfitness-api-production`
- [ ] Set retention policies (optional, recommended: 7-30 days)

**Command:**
```bash
aws logs create-log-group \
  --log-group-name /ecs/flowfitness-api-staging \
  --region us-east-1

aws logs create-log-group \
  --log-group-name /ecs/flowfitness-api-production \
  --region us-east-1
```

## GitHub Configuration

### 7. GitHub Environments
- [ ] Go to: Repository Settings → Environments
- [ ] Create `staging` environment
- [ ] Create `production` environment

### 8. GitHub Secrets - Staging Environment
- [ ] Add to `staging` environment:
  - `AWS_ROLE_ARN`: `arn:aws:iam::ACCOUNT_ID:role/GitHubActionsDeployRole`
  - `AWS_REGION`: `us-east-1` (or your preferred region)
  - `ECR_REPOSITORY`: `flowfitness-api`
  - `ECS_CLUSTER`: `flowfitness-cluster`
  - `ECS_SERVICE`: `flowfitness-api-staging-svc`

### 9. GitHub Secrets - Production Environment
- [ ] Add to `production` environment:
  - `AWS_ROLE_ARN`: `arn:aws:iam::ACCOUNT_ID:role/GitHubActionsDeployRole`
  - `AWS_REGION`: `us-east-1` (or your preferred region)
  - `ECR_REPOSITORY`: `flowfitness-api`
  - `ECS_CLUSTER`: `flowfitness-cluster`
  - `ECS_SERVICE`: `flowfitness-api-production-svc`

## Code Updates

### 10. Update Task Definitions
- [ ] Update `ecs/taskdef-staging.json`:
  - Replace `ACCOUNT_ID` with your AWS account ID
  - Replace `ECR_REPOSITORY_URI` with actual ECR repository URI
  - Replace `AWS_REGION` with your region
- [ ] Update `ecs/taskdef-prod.json`:
  - Replace `ACCOUNT_ID` with your AWS account ID
  - Replace `ECR_REPOSITORY_URI` with actual ECR repository URI
  - Replace `AWS_REGION` with your region

## Testing

### 11. Test Staging Deployment
- [ ] Push changes to `develop` branch
- [ ] Verify GitHub Actions workflow runs successfully
- [ ] Check ECS service is updated with new task definition
- [ ] Verify application is accessible and health check passes

### 12. Test Production Deployment
- [ ] Create a release tag: `git tag v1.0.0 && git push origin v1.0.0`
- [ ] Verify GitHub Actions workflow runs successfully
- [ ] Check ECS service is updated with new task definition
- [ ] Verify application is accessible and health check passes

## Future Enhancements

### 13. Application Secrets
- [ ] Store application secrets in AWS Secrets Manager or SSM Parameter Store
- [ ] Update task definitions to reference secrets (add `secrets` section to container definitions)
- [ ] Test secret retrieval in application

## Notes

- All AWS resources should be created in the same region
- Keep track of resource ARNs and IDs for configuration
- Review IAM policies to follow least-privilege principle
- Consider cost optimization (Fargate Spot for staging, right-sizing resources)
- Enable CloudWatch alarms for service health monitoring

## Reference Documentation

- [AWS Deployment Guide](./docs/AWS_DEPLOYMENT.md) - Detailed setup instructions
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)

