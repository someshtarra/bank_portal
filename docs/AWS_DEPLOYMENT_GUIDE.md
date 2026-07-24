# AWS 3-Tier Production Architecture & Deployment Guide

This guide details how to deploy the **Banking Portal Application** on AWS using a highly available, secure 3-Tier Architecture.

```
                      [ Internet Users ]
                              │
                              ▼
                   ┌─────────────────────┐
                   │   Amazon Route 53   │
                   └──────────┬──────────┘
                              │
       ┌──────────────────────┴──────────────────────┐
       │ Public Hosted Zone: rebel7781.xyz           │
       │  - virat.rebel7781.xyz  ──► Frontend ALB    │
       │  - api.rebel7781.xyz    ──► Backend ALB     │
       └─────────────────────────────────────────────┘

========================================================================================
VPC: 10.20.0.0/16
========================================================================================

  PUBLIC SUBNETS (Internet Gateway Access)
  ├── 10.20.1.0/24 (AZ-a) : Frontend ALB (Node A) + NAT Gateway
  └── 10.20.2.0/24 (AZ-b) : Frontend ALB (Node B) + NAT Gateway
            │
            ▼
  PRESENTATION TIER (Frontend - React + Apache httpd)
  ├── Private Subnet 10.20.3.0/24 (AZ-a) : Frontend EC2 Instances
  └── Private Subnet 10.20.4.0/24 (AZ-b) : Frontend EC2 Instances
            │
            ▼ (via Backend ALB)
  APPLICATION TIER (Backend - Node.js + Express + PM2)
  ├── Private Subnet 10.20.5.0/24 (AZ-a) : Backend EC2 Instances
  └── Private Subnet 10.20.6.0/24 (AZ-b) : Backend EC2 Instances
            │
            ▼ (Port 3306)
  DATABASE TIER (Data Layer - Amazon RDS MySQL Multi-AZ)
  ├── Private Subnet 10.20.7.0/24 (AZ-a) \
  └── Private Subnet 10.20.8.0/24 (AZ-b) ──► Amazon RDS MySQL (book.rbs.com)
========================================================================================
```

---

## 1. Architecture Specification

### Tier 1: Presentation Tier (Frontend Web Servers)
- **Subnets**: `10.20.3.0/24` (AZ-a) & `10.20.4.0/24` (AZ-b)
- **Tech Stack**: React (Vite SPA) served via Apache `httpd` web server.
- **DNS**: `virat.rebel7781.xyz` pointing to Frontend ALB.

### Tier 2: Application Tier (Backend REST API)
- **Subnets**: `10.20.5.0/24` (AZ-a) & `10.20.6.0/24` (AZ-b)
- **Tech Stack**: Node.js + Express REST API managed by PM2 process manager.
- **DNS**: `api.rebel7781.xyz` pointing to Backend ALB.

### Tier 3: Database Tier (Data Storage)
- **Subnets**: `10.20.7.0/24` (AZ-a) & `10.20.8.0/24` (AZ-b)
- **Tech Stack**: Amazon RDS MySQL 8.0 Multi-AZ deployment.
- **Private DNS**: `book.rbs.com` (Private Hosted Zone `rbs.com`).

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
