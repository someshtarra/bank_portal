# Enterprise AWS 3-Tier Deployment Guide & Infrastructure Runbook
**Platform**: Enterprise 3-Tier Digital Banking Platform  
**Classification**: Enterprise Production Engineering Runbook  
**Target VPC CIDR**: `10.20.0.0/16`  
**Domain Names**: `virat.rebel7781.xyz` (Frontend), `api.rebel7781.xyz` (Backend), `book.rbs.com` (Database)  

---

## 📋 Comprehensive 25-Step Deployment Checklist

- [x] Step 01: Create Amazon VPC (`10.20.0.0/16`)
- [x] Step 02: Enable VPC DNS Hostnames & Resolution
- [x] Step 03: Create & Attach Internet Gateway (`igw-bank-vpc`)
- [x] Step 04: Create Multi-AZ Public Subnets (`10.20.1.0/24`, `10.20.2.0/24`)
- [x] Step 05: Create Multi-AZ Presentation Private Subnets (`10.20.3.0/24`, `10.20.4.0/24`)
- [x] Step 06: Create Multi-AZ Application Private Subnets (`10.20.5.0/24`, `10.20.6.0/24`)
- [x] Step 07: Create Multi-AZ Database Isolated Subnets (`10.20.7.0/24`, `10.20.8.0/24`)
- [x] Step 08: Allocate Elastic IPs & Create NAT Gateways
- [x] Step 09: Configure Public & Private Route Tables
- [x] Step 10: Configure Network ACLs (NACL)
- [x] Step 11: Create Security Groups (`sg-alb`, `sg-frontend`, `sg-backend`, `sg-database`)
- [x] Step 12: Configure IAM Roles & Instance Profiles
- [x] Step 13: Provision Amazon RDS MySQL Multi-AZ DB Cluster (`book.rbs.com`)
- [x] Step 14: Provision Application Tier EC2 Instances (Node.js + PM2)
- [x] Step 15: Provision Presentation Tier EC2 Instances (React + Apache `httpd`)
- [x] Step 16: Configure Target Groups (`tg-frontend-http`, `tg-backend-api`)
- [x] Step 17: Create Application Load Balancers (Public Frontend & Backend ALBs)
- [x] Step 18: Request & Validate AWS ACM SSL/TLS Certificates
- [x] Step 19: Configure Route 53 Public Hosted Zone (`rebel7781.xyz`)
- [x] Step 20: Configure Route 53 Private Hosted Zone (`rbs.com`)
- [x] Step 21: Import Database Schema & Seed Data into RDS
- [x] Step 22: Configure & Start Node.js Backend API via PM2
- [x] Step 23: Configure Apache HTTP Reverse Proxy & SSL Termination
- [x] Step 24: Deploy Compiled React SPA Production Artifacts
- [x] Step 25: End-to-End Production Verification & Traffic Validation

---

## Step 01: Create Amazon VPC (`10.20.0.0/16`)

### Purpose
Establish an isolated virtual network boundary for the 3-tier banking application.

### AWS Console Navigation
AWS Console ➔ VPC ➔ **Create VPC** ➔ Select *VPC only* ➔ Name: `bank-vpc` ➔ IPv4 CIDR: `10.20.0.0/16`.

### AWS CLI Command
```bash
aws ec2 create-vpc \
  --cidr-block 10.20.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=bank-vpc}]'
```

### Verification Command
```bash
aws ec2 describe-vpcs --filters Name=tag:Name,Values=bank-vpc --query "Vpcs[0].[VpcId,CidrBlock,State]" --output table
```

### Expected Output
```text
---------------------------------------
|            DescribeVpcs             |
+----------------------+---------------+
|  vpc-0a1b2c3d4e5f678 |  10.20.0.0/16 |  available
---------------------------------------
```

---

## Step 08: Allocate Elastic IPs & Create NAT Gateways

### Purpose
Provide secure outbound internet egress for private application subnets (for yum patches and external payment gateway calls) without allowing inbound internet connections.

### AWS CLI Commands
```bash
# Allocate EIP for AZ-a NAT Gateway
aws ec2 allocate-address \
  --domain vpc \
  --tag-specifications 'ResourceType=elastic-ip,Tags=[{Key=Name,Value=eip-nat-az-a}]'

# Create NAT Gateway in Public Subnet 1 (AZ-a)
aws ec2 create-nat-gateway \
  --subnet-id subnet-10.20.1.0-id \
  --allocation-id eipalloc-12345678 \
  --tag-specifications 'ResourceType=natgateway,Tags=[{Key=Name,Value=nat-az-a}]'
```

---

## Step 13: Provision Amazon RDS MySQL Multi-AZ Cluster

### Purpose
Create a high-availability, zero-data-loss relational database storage engine across `us-east-1a` and `us-east-1b`.

### AWS CLI Command
```bash
aws rds create-db-instance \
  --db-instance-identifier bank-rds-mysql \
  --db-instance-class db.r6g.xlarge \
  --engine mysql \
  --engine-version 8.0.35 \
  --master-username admin \
  --master-user-password Somesh12345 \
  --allocated-storage 100 \
  --max-allocated-storage 500 \
  --multi-az \
  --vpc-security-group-ids sg-database-id \
  --db-subnet-group-name dbsng-bank-vpc \
  --no-publicly-accessible \
  --backup-retention-period 35 \
  --preferred-backup-window 02:00-03:00 \
  --preferred-maintenance-window sun:04:00-sun:05:00
```

### Verification Command
```bash
aws rds describe-db-instances \
  --db-instance-identifier bank-rds-mysql \
  --query "DBInstances[0].[DBInstanceStatus, Endpoint.Address, MultiAZ]" --output table
```

---

## Step 22: Configure & Start Node.js Backend API via PM2

### Purpose
Launch the Node.js application under PM2 process supervision across all available CPU cores.

### Linux Commands
```bash
# Navigate to backend application directory
cd /home/ec2-user/bank_portal/backend

# Install production dependencies
npm install --production

# Create production .env configuration
cat << 'EOF' > .env
PORT=5000
NODE_ENV=production
JWT_SECRET=my_super_secret_jwt_key_123
DB_HOST=book.rbs.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=Somesh12345
DB_NAME=bank_portal_db
EOF

# Start Node.js cluster via PM2
pm2 start index.js -i max --name "backendapi"

# Save PM2 process list for auto-boot recovery
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

### Verification Command
```bash
pm2 status
curl -s http://localhost:5000/api/health
```

---

## Step 23: Configure Apache HTTP Reverse Proxy & SSL Termination

### Purpose
Configure Apache (`httpd`) on Presentation Tier instances to serve React static production assets directly and reverse proxy `/api` requests to Node.js backend processes.

### Linux Commands
```bash
# Write virtual host configuration
sudo bash -c 'cat << "EOF" > /etc/httpd/conf.d/bank_portal.conf
<VirtualHost *:80>
    ServerName virat.rebel7781.xyz
    DocumentRoot /var/www/html/dist

    <Directory "/var/www/html/dist">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    ProxyRequests Off
    ProxyPreserveHost On
    ProxyPass /api http://127.0.0.1:5000/api
    ProxyPassReverse /api http://127.0.0.1:5000/api
</VirtualHost>
EOF'

# Enable SELinux HTTP proxy permission
sudo setsebool -P httpd_can_network_connect 1

# Test Apache Syntax & Restart
sudo httpd -t
sudo systemctl restart httpd
```

### Verification Command
```bash
sudo systemctl status httpd
curl -Iv http://localhost/api/health
```

---

## Step 25: End-to-End Production Verification & Health Check

### Linux Verification Commands
```bash
# Test Public Frontend Domain
curl -Iv https://virat.rebel7781.xyz

# Test Public Backend API Endpoint
curl -s https://api.rebel7781.xyz/api/health
```

### Expected Output
```json
{
  "status": "UP",
  "service": "Banking Portal REST API",
  "timestamp": "2026-07-24T20:59:00.000Z"
}
```
