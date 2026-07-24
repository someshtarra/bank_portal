# 🏦 Somesh National Bank - Enterprise Banking Portal

A production-quality, three-tier Digital Banking Portal built with **React (Vite)**, **Node.js (Express)**, **MySQL (3NF)**, **Docker**, and **AWS Architecture**.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React_18_|_Vite_|_Tailwind-blue)
![Node](https://img.shields.io/badge/Backend-Node.js_|_Express_|_JWT-green)
![MySQL](https://img.shields.io/badge/Database-MySQL_8.0_3NF-orange)

---

## 🌟 Key Banking Features

### 👤 Customer Portal
- **Dashboard**: Real-time total balance across accounts, recent activity feed, and interactive Chart.js financial charts.
- **Deposit / Withdraw**: Credit or withdraw funds instantly. Enforces **₹1,000 minimum balance** check.
- **Money Transfer**: Instant 24x7 fund transfers between accounts with unique reference IDs (`TXN...`).
- **Digital Cards**: Manage virtual Visa Debit & Credit cards with instant block/unblock security controls.
- **Account Statements**: Search, filter by date/type, paginate, and **download official PDF statements**.
- **Loan Applications**: Apply for pre-approved Personal, Home, and Auto loans.
- **Profile & Security**: Upload avatar, update contact info, change password, and toggle Dark/Light mode.

### 👑 Admin Portal
- **Executive Analytics**: Total customers, total bank balance holdings, daily transaction volumes, and loan metrics.
- **Customer Management**: Full CRUD operations, search by Aadhaar/PAN, and Freeze/Activate accounts.
- **Employee Roster**: Create and assign bank staff officers.
- **Audit Logs**: Real-time security trail recording user logins, transfers, and status changes with IP tracking.

### 💼 Employee Workbench
- **KYC Queue**: Inspect customer Aadhaar and PAN documents, approve or reject KYC verifications.
- **Branch Operations**: Oversee customer deposits, withdrawals, and loan application queues.

---

## 🔑 Demo Account Credentials

All accounts pre-seeded with password: `Password@123`

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Customer** | `rajesh.kumar@example.com` | `Password@123` | Savings & Checking Accounts, Transfers, PDF Download |
| **Employee** | `employee@bankportal.com` | `Password@123` | KYC Approval Queue, Branch Workbench |
| **Admin** | `admin@bankportal.com` | `Password@123` | System Analytics, Freeze Accounts, Audit Logs |

## 🏗️ AWS 3-Tier Architecture Overview

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

## 🔌 Step-by-Step AWS 3-Tier Deployment & Connection Guide

Follow this guide to deploy and connect **Somesh National Bank** across all 3 tiers in your AWS VPC (`10.20.0.0/16`).

### 🌐 Network & Subnet Topology Breakdown

| Tier | Availability Zone | Subnet CIDR | Component | Service |
| :--- | :--- | :--- | :--- | :--- |
| **Public** | `us-east-1a` | `10.20.1.0/24` | Frontend ALB & NAT Gateway | Public Gateway |
| **Public** | `us-east-1b` | `10.20.2.0/24` | Frontend ALB & NAT Gateway | Public Gateway |
| **Presentation** | `us-east-1a` | `10.20.3.0/24` | Frontend Web Server | EC2 (React + Apache) |
| **Presentation** | `us-east-1b` | `10.20.4.0/24` | Frontend Web Server | EC2 (React + Apache) |
| **Application** | `us-east-1a` | `10.20.5.0/24` | Backend REST API | EC2 (Node.js + PM2) |
| **Application** | `us-east-1b` | `10.20.6.0/24` | Backend REST API | EC2 (Node.js + PM2) |
| **Database** | `us-east-1a` | `10.20.7.0/24` | Database Primary | RDS MySQL Multi-AZ |
| **Database** | `us-east-1b` | `10.20.8.0/24` | Database Standby | RDS MySQL Multi-AZ |

---

### Phase 1: Database Tier Setup (AWS RDS MySQL)

#### Step 1.1: Configure `backend/.env`
Go to the `backend/` directory on your EC2 instance and configure your `.env`:
```bash
cd backend
nano .env
```
Paste your database credentials pointing to your Private Hosted Zone (`book.rbs.com`):
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=my_super_secret_jwt_key_123

# Database Connection (AWS RDS Multi-AZ via Private DNS)
DB_HOST=book.rbs.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=Somesh12345
DB_NAME=bank_portal_db
```

#### Step 1.2: Configure Database Security Group (`sg-database`)
In AWS Console -> **RDS** -> Click your Database -> Click **VPC Security Group**:
1. Click **Edit Inbound Rules** -> **Add Rule**:
   - **Type**: `MySQL/Aurora` (Port `3306`)
   - **Source**: `sg-backend` (or Application Subnets `10.20.5.0/24` & `10.20.6.0/24`)
2. Click **Save rules**.

#### Step 1.3: Import Database Schema & Seed Data
Execute database initialization from a backend EC2 instance:
```bash
# Create database
mysql -h book.rbs.com -u admin -p -e "CREATE DATABASE IF NOT EXISTS bank_portal_db;"

# Import 3NF schema tables
mysql -h book.rbs.com -u admin -p bank_portal_db < test.sql

# Import seed data
mysql -h book.rbs.com -u admin -p bank_portal_db < ../database/seed.sql
```

#### Step 1.4: Start Backend API with PM2
```bash
cd backend
npm install
pm2 start index.js --name "backendapi"
pm2 save
pm2 startup
```
*Verify output with `pm2 logs backendapi`. It will show `✅ MySQL Database connected successfully.`*

---

### Phase 2: Presentation Tier Setup (React Client + Apache)

#### Step 2.1: Configure `client/.env`
On your frontend build environment / EC2:
```bash
cd client
nano .env
```
Set the Backend ALB Public Domain:
```env
VITE_API_URL=https://api.rebel7781.xyz/api
```

#### Step 2.2: Build Production Bundle
```bash
npm install
npm run build
```

#### Step 2.3: Copy Build Assets to Apache
```bash
sudo mkdir -p /var/www/html/dist
sudo cp -r dist/* /var/www/html/dist/
sudo chown -R apache:apache /var/www/html/dist
sudo chmod -R 755 /var/www/html/dist
```

#### Step 2.4: Configure Apache (`httpd`) Reverse Proxy
Edit `/etc/httpd/conf.d/bank_portal.conf`:
```bash
sudo nano /etc/httpd/conf.d/bank_portal.conf
```
Paste:
```apache
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

<VirtualHost *:443>
    ServerName virat.rebel7781.xyz
    DocumentRoot /var/www/html/dist

    SSLEngine on
    SSLCertificateFile /etc/pki/tls/certs/localhost.crt
    SSLCertificateKeyFile /etc/pki/tls/private/localhost.key

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
```

#### Step 2.5: Test and Restart Apache
```bash
sudo httpd -t
sudo systemctl restart httpd
```

---

## 🧪 Running Unit Tests

```bash
cd backend
npm test
```
Executes Jest + Supertest suite testing authentication, deposit, minimum balance enforcement, and role permissions.

---

## 📁 Repository Structure

```
bank_portal/
├── backend/                  # Node.js + Express REST API
│   ├── .env.example          # Environment variables template
│   ├── .gitignore            # Git ignore rules
│   ├── index.js              # Server entrypoint (npm / PM2)
│   ├── package-lock.json
│   ├── package.json
│   ├── test.sql              # MySQL database schema script
│   ├── server.js             # Express app setup
│   ├── config/               # Database pool connection config
│   ├── controllers/          # Auth, Customer, Admin, Employee, Loan, Card
│   ├── middleware/           # Auth JWT, RBAC, Validation, Multer, Error
│   └── routes/               # Express API routing
├── client/                   # React.js (Vite) + Tailwind CSS SPA Frontend
│   ├── public/               # Static web assets
│   ├── src/
│   │   ├── components/       # Common UI, Charts, Layouts
│   │   ├── context/          # AuthContext & ThemeContext
│   │   ├── pages/            # Public, Customer, Admin, Employee views
│   │   └── services/api.js   # Axios instance with JWT interceptors
│   ├── .gitignore
│   ├── package-lock.json
│   └── package.json
├── database/
│   ├── schema.sql            # 3NF MySQL Database Schema
│   └── seed.sql              # Pre-populated sample data
├── docs/
│   ├── API_DOCUMENTATION.md  # Complete REST API Specification
│   ├── AWS_DEPLOYMENT_GUIDE.md # AWS 3-Tier Production Architecture Guide
│   └── Banking_Portal.postman_collection.json
├── docker-compose.yml        # Docker Multi-Container orchestration
└── README.md
```

---

## 🛡️ Security & Banking Rules Enforced
1. **Minimum Balance**: Customer savings balance cannot drop below **₹1,000**.
2. **Negative Balance Guard**: Transactions are checked atomically to prevent overdrafts.
3. **Atomic Operations**: Database transactions rollback automatically on error to guarantee consistent ledger balances.
4. **Password Hashing**: Cryptographic password protection via `bcryptjs`.
5. **RBAC Protection**: API endpoints verified against JWT roles (`customer`, `employee`, `admin`).
6. **Audit Security**: Every critical user action is persisted in `audit_logs` table with IP address and timestamp.
