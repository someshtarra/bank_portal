# 🏦 Antigravity National Bank - Enterprise Banking Portal

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

---

## 🛠️ Quick Start Instructions

### Option 1: Zero-Config Local Setup (Automatic DB Fallback)

1. **Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   *Note: If MySQL is not running on port 3306, the backend automatically boots an in-memory database pre-seeded with all demo accounts!*

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

### Option 2: Docker Compose (Full Stack with MySQL)

```bash
docker-compose up --build -d
```
- **Frontend SPA**: `http://localhost`
- **Backend REST API**: `http://localhost:5000/api`
- **MySQL DB**: `localhost:3306`

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
│   ├── config/db.js          # MySQL connection pool + SQLite fallback
│   ├── controllers/          # Auth, Customer, Admin, Employee, Loan, Card
│   ├── middleware/           # Auth JWT, RBAC, Validation, Multer, Error
│   ├── routes/               # Express routing
│   ├── tests/                # Jest API tests
│   └── server.js             # Express Server entrypoint
├── frontend/                 # React.js (Vite) + Tailwind CSS SPA
│   ├── src/
│   │   ├── components/       # Common UI, Charts, Layouts
│   │   ├── context/          # AuthContext & ThemeContext
│   │   ├── pages/            # Public, Customer, Admin, Employee views
│   │   └── services/api.js   # Axios instance with JWT interceptors
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
