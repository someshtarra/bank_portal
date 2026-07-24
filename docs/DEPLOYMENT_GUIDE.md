# Enterprise AWS 3-Tier Infrastructure Deployment Runbook
**Platform**: Enterprise 3-Tier Digital Banking Platform  
**Classification**: Enterprise Production Operations Manual  
**VPC CIDR**: `10.20.0.0/16`  

---

## 📋 Complete AWS Component Provisioning Checklist

- [x] **Component 01: Amazon VPC Setup** (`10.20.0.0/16`)
- [x] **Component 02: Multi-AZ Subnets & Route Tables** (Public, Presentation, Application, Isolated DB Tiers)
- [x] **Component 03: Internet Gateway & NAT Gateways**
- [x] **Component 04: Tiered Security Groups** (`sg-alb`, `sg-frontend`, `sg-backend`, `sg-database`)
- [x] **Component 05: Amazon EC2 Golden Instance Provisioning**
- [x] **Component 06: Amazon Machine Image (AMI) Bake** (`ami-bank-frontend-v1`, `ami-bank-backend-v1`)
- [x] **Component 07: AWS Launch Templates** (`lt-bank-frontend`, `lt-bank-backend`)
- [x] **Component 08: ALB Target Groups** (`tg-frontend-http`, `tg-backend-api`)
- [x] **Component 09: Application Load Balancers** (Public Frontend ALB & Public/Internal Backend ALB)
- [x] **Component 10: Auto Scaling Groups (ASG)** (`asg-frontend-tier`, `asg-backend-tier`)
- [x] **Component 11: AWS Certificate Manager (ACM)** (SSL/TLS Encryption for `rebel7781.xyz`)
- [x] **Component 12: Route 53 DNS Hosted Zones** (Public: `rebel7781.xyz`, Private: `rbs.com`)
- [x] **Component 13: Amazon RDS MySQL Multi-AZ Cluster** (`book.rbs.com`)

---

## Component 01: VPC & Subnet Network Setup

```bash
# 1. Create Amazon VPC
aws ec2 create-vpc \
  --cidr-block 10.20.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=bank-vpc}]'

# 2. Enable DNS Attributes
aws ec2 modify-vpc-attribute --vpc-id vpc-12345678 --enable-dns-hostnames '{"Value": true}'
aws ec2 modify-vpc-attribute --vpc-id vpc-12345678 --enable-dns-support '{"Value": true}'

# 3. Create Multi-AZ Subnets
aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.20.1.0/24 --availability-zone us-east-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=pub-sn-1a}]'
aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.20.2.0/24 --availability-zone us-east-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=pub-sn-2b}]'
aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.20.3.0/24 --availability-zone us-east-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=pvt-sn-3a}]'
aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.20.4.0/24 --availability-zone us-east-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=pvt-sn-4b}]'
aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.20.5.0/24 --availability-zone us-east-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=pvt-sn-5a}]'
aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.20.6.0/24 --availability-zone us-east-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=pvt-sn-6b}]'
aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.20.7.0/24 --availability-zone us-east-1a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=pvt-sn-7a}]'
aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.20.8.0/24 --availability-zone us-east-1b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=pvt-sn-8b}]'
```

---

## Component 06: Amazon Machine Image (AMI) Bake

### Purpose
Bake hardened Golden AMIs containing pre-installed dependencies for rapid Auto Scaling instance launches.

### AWS CLI Commands
```bash
# 1. Create Golden AMI for Backend API Node.js Server
aws ec2 create-image \
  --instance-id i-0123456789backend \
  --name "ami-bank-backend-v1.0" \
  --description "Hardened Node.js 18 + PM2 Application Golden AMI" \
  --no-reboot

# 2. Create Golden AMI for Frontend Web Server (Apache)
aws ec2 create-image \
  --instance-id i-0123456789frontend \
  --name "ami-bank-frontend-v1.0" \
  --description "Hardened Apache httpd + React SPA Golden AMI" \
  --no-reboot
```

---

## Component 07: AWS Launch Templates

### Purpose
Define standardized configuration parameters (AMI, Instance Type, Security Groups, IAM Profile, User Data) for Auto Scaling.

### AWS CLI Commands
```bash
# Create Launch Template for Application Tier
aws ec2 create-launch-template \
  --launch-template-name lt-bank-backend \
  --version-description "v1.0 Production Backend Template" \
  --launch-template-data '{
    "ImageId": "ami-0123456789backend",
    "InstanceType": "c6i.large",
    "SecurityGroupIds": ["sg-backend-id"],
    "IamInstanceProfile": {"Name": "EC2-Application-Role"},
    "UserData": "IyEvYmluL2Jhc2gKcG0yIHJlbG9hZCBiYWNrZW5kYXBp"
  }'
```

---

## Component 08: ALB Target Groups

### Purpose
Configure health checking pools for load balancer distribution.

### AWS CLI Commands
```bash
# 1. Target Group for Backend REST API
aws elbv2 create-target-group \
  --name tg-backend-api \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-12345678 \
  --health-check-protocol HTTP \
  --health-check-port 5000 \
  --health-check-path /api/health \
  --health-check-interval-seconds 15 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# 2. Target Group for Frontend Apache Web Server
aws elbv2 create-target-group \
  --name tg-frontend-http \
  --protocol HTTP \
  --port 80 \
  --vpc-id vpc-12345678 \
  --health-check-protocol HTTP \
  --health-check-path / \
  --health-check-interval-seconds 15
```

---

## Component 09: Application Load Balancers (ALB)

### Purpose
Distribute incoming HTTP/HTTPS traffic across multi-AZ EC2 targets.

### AWS CLI Commands
```bash
# Create Public Frontend ALB
aws elbv2 create-load-balancer \
  --name alb-bank-frontend \
  --subnets subnet-10.20.1.0-id subnet-10.20.2.0-id \
  --security-groups sg-alb-id \
  --scheme internet-facing \
  --type application

# Create Public Backend API ALB
aws elbv2 create-load-balancer \
  --name alb-bank-backend \
  --subnets subnet-10.20.1.0-id subnet-10.20.2.0-id \
  --security-groups sg-alb-id \
  --scheme internet-facing \
  --type application
```

---

## Component 10: Auto Scaling Groups (ASG)

### Purpose
Maintain high availability and dynamic elasticity by automatically scaling EC2 capacity based on CPU metrics.

### AWS CLI Commands
```bash
# Create ASG for Application Tier across Subnets 5a & 6b
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name asg-backend-tier \
  --launch-template LaunchTemplateId=lt-bank-backend-id,Version=1 \
  --min-size 2 \
  --max-size 10 \
  --desired-capacity 4 \
  --vpc-zone-identifier "subnet-10.20.5.0-id,subnet-10.20.6.0-id" \
  --target-group-arns arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/tg-backend-api/123 \
  --health-check-type ELB \
  --health-check-grace-period 300
```

---

## Component 11: AWS Certificate Manager (ACM) SSL/TLS

### Purpose
Request and manage 256-bit SSL certificates for HTTPS encryption.

### AWS CLI Commands
```bash
# Request Certificate for Domain *.rebel7781.xyz
aws acm request-certificate \
  --domain-name "*.rebel7781.xyz" \
  --validation-method DNS \
  --idempotency-token bankcert2026
```

---

## Component 12: Route 53 Public & Private DNS

### Purpose
Configure DNS record routing for public endpoints (`virat.rebel7781.xyz`, `api.rebel7781.xyz`) and private database endpoint (`book.rbs.com`).

### AWS CLI Commands
```bash
# Create Private Hosted Zone rbs.com associated with bank-vpc
aws route53 create-hosted-zone \
  --name rbs.com \
  --vpc VPCRegion=us-east-1,VPCId=vpc-12345678 \
  --caller-reference bank-private-dns-2026

# Create CNAME Record for book.rbs.com
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "book.rbs.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "bank-rds-mysql.c123456.us-east-1.rds.amazonaws.com"}]
      }
    }]
  }'
```

---

## Component 13: Amazon RDS MySQL Multi-AZ Cluster

### Purpose
Deploy Multi-AZ MySQL Database engine in isolated subnets `10.20.7.0/24` and `10.20.8.0/24`.

### AWS CLI Command
```bash
aws rds create-db-instance \
  --db-instance-identifier bank-rds-mysql \
  --db-instance-class db.r6g.xlarge \
  --engine mysql \
  --master-username admin \
  --master-user-password Somesh12345 \
  --allocated-storage 100 \
  --multi-az \
  --vpc-security-group-ids sg-database-id \
  --db-subnet-group-name dbsng-bank-vpc \
  --no-publicly-accessible
```
