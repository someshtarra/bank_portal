# Banking Portal REST API Specification

## Base URL
`http://localhost:5000/api`

## Authentication Header
All protected endpoints require an HTTP Authorization header containing a valid Bearer JWT:
`Authorization: Bearer <jwt_token>`

---

## 1. Authentication Endpoints (`/api/auth`)

### `POST /api/auth/register`
Registers a new customer account.
- **Request Body**:
  ```json
  {
    "first_name": "Rajesh",
    "last_name": "Kumar",
    "email": "rajesh@example.com",
    "password": "Password@123",
    "phone": "+91 9876543212",
    "address": "123 MG Road, Bengaluru",
    "dob": "1990-05-15",
    "aadhaar": "123456789012",
    "pan": "ABCDE1234F"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "token": "<jwt>",
    "user": { "id": 3, "role": "customer", "customer_id": 1 }
  }
  ```

### `POST /api/auth/login`
Authenticates a user (Customer, Employee, or Admin).
- **Request Body**:
  ```json
  {
    "email": "admin@bankportal.com",
    "password": "Password@123"
  }
  ```

### `POST /api/auth/logout`
Logs out current user session.

### `POST /api/auth/forgot-password`
Generates a password reset token.

### `POST /api/auth/reset-password`
Resets password using valid token.

---

## 2. Customer Endpoints (`/api/customer`)

### `GET /api/customer/profile`
Returns profile details and linked bank accounts for logged-in user.

### `PUT /api/customer/profile`
Updates phone, address, and profile picture (Multipart Form Data).

### `GET /api/customer/accounts`
Lists savings and checking accounts with balance details.

### `GET /api/customer/transactions`
Retrieves transaction ledger with filtering (`search`, `transaction_type`, `start_date`, `end_date`, `page`, `limit`).

---

## 3. Transaction Endpoints (`/api/transactions`)

### `POST /api/transactions/deposit`
- **Request Body**:
  ```json
  {
    "account_number": "100120240001",
    "amount": 5000,
    "description": "Salary Deposit"
  }
  ```

### `POST /api/transactions/withdraw`
Enforces minimum balance ₹1,000 rule.
- **Request Body**:
  ```json
  {
    "account_number": "100120240001",
    "amount": 2000,
    "description": "ATM Cash"
  }
  ```

### `POST /api/transactions/transfer`
Atomic fund transfer between sender and receiver.
- **Request Body**:
  ```json
  {
    "sender_account": "100120240001",
    "receiver_account": "100120240003",
    "amount": 10000,
    "description": "Rent Payment"
  }
  ```

---

## 4. Admin Endpoints (`/api/admin`)

### `GET /api/admin/dashboard`
Returns total customers, total balance holdings, daily transaction counts, and audit logs.

### `GET /api/admin/customers`
Search and list all customers.

### `POST /api/admin/customers`
Create customer profile manually.

### `PUT /api/admin/accounts/:id/status`
Freeze or Activate account (`status`: `"active"` | `"frozen"`).

### `GET /api/admin/audit-logs`
Returns security audit logs.

---

## 5. Employee Endpoints (`/api/employee`)

### `GET /api/employee/kyc/pending`
Lists pending customer KYC requests.

### `PUT /api/employee/kyc/verify/:id`
Approve or reject customer KYC (`status`: `"verified"` | `"rejected"`).
