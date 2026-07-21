# AWS 3-Tier Production Architecture & Deployment Guide

This guide details how to deploy the **Banking Portal Application** on AWS using a highly available, secure 3-Tier Architecture.

```
                   [ Internet ]
                        │
                  [ Route 53 ]
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
   [ AWS CloudFront ]        [ Application ]
            │                [ Load Balancer]
            ▼                       │
    [ Amazon S3 ]                   ▼
  (Frontend React SPA)     ┌─────────────────┐
                           │   EC2 Auto      │
                           │   Scaling Group │ (Backend Node.js API)
                           └────────┬────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │   Amazon RDS    │ (MySQL Multi-AZ)
                           │ (Private Subnet)│
                           └─────────────────┘
```

---

## 1. Architecture Overview

### Tier 1: Frontend Presentation Tier
- **Amazon S3**: Hosts static compiled React Vite SPA bundle (`dist/`).
- **Amazon CloudFront**: Global CDN delivering TLS/SSL encryption, edge caching, and DDoS mitigation via AWS Shield.

### Tier 2: Backend Application Tier
- **Application Load Balancer (ALB)**: Distributes incoming HTTPS requests across EC2 instances.
- **Auto Scaling Group (ASG)**: EC2 instances running Node.js Express API inside Docker containers managed by PM2 or ECS.
- **VPC Security Groups**: Restricts EC2 ingress exclusively to traffic originating from the ALB on port 5000.

### Tier 3: Database Tier
- **Amazon RDS MySQL**: Multi-AZ deployment for zero data loss and automated failover.
- **Private Subnet Isolation**: RDS instances placed in isolated private subnets inaccessible from the internet.

---

## 2. Step-by-Step Deployment Instructions

### Step 1: Database Setup (Amazon RDS MySQL)
1. Navigate to AWS RDS Console -> **Create Database**.
2. Select **MySQL 8.0** -> Multi-AZ DB Instance.
3. Configure VPC Subnet Group spanning 2 Private Subnets.
4. Set Master Username `root` and DB Name `bank_portal_db`.
5. Run `schema.sql` and `seed.sql` migration scripts via Bastion host or Cloud9.

### Step 2: Backend Deployment (EC2 + Application Load Balancer)
1. Launch 2 EC2 T3.medium instances running Amazon Linux 2023.
2. Install Docker & Git:
   ```bash
   sudo dnf update -y
   sudo dnf install -y docker git
   sudo systemctl enable --now docker
   ```
3. Clone repository and set up environment file `.env`:
   ```bash
   git clone <repo-url> /opt/bank_portal
   cd /opt/bank_portal/backend
   cp .env.example .env
   ```
4. Build and start container:
   ```bash
   docker build -t bank-backend .
   docker run -d --name bank_api -p 5000:5000 --env-file .env bank-backend
   ```
5. Create Target Group for ALB on port 5000 pointing to `/api/health`.

### Step 3: Frontend Deployment (S3 + CloudFront)
1. Build React production assets locally or via CI/CD:
   ```bash
   cd frontend
   npm run build
   ```
2. Create S3 Bucket `bank-portal-frontend-prod` and sync assets:
   ```bash
   aws s3 sync dist/ s3://bank-portal-frontend-prod --delete
   ```
3. Create CloudFront distribution with Origin Access Control (OAC) restricting direct S3 access.
4. Configure Custom Error Response: Map 404/403 to `/index.html` with status code 200 (SPA client routing).

---

## 3. Security & IAM Policies
- Enforce HTTPS via AWS Certificate Manager (ACM).
- Configure AWS WAF (Web Application Firewall) on ALB and CloudFront to block SQL injection and rate-limit IP requests.
- Store sensitive DB passwords in AWS Systems Manager Parameter Store / Secrets Manager.
