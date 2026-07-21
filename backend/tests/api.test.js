const request = require('supertest');
const app = require('../server');
const { initDB } = require('../config/db');

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.USE_SQLITE = 'true';
    await initDB();
});

describe('Banking Portal REST API Tests', () => {
    let customerToken;
    let adminToken;
    let accountNumber = '100120240001';

    test('GET /api/health - Server status check', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('UP');
    });

    test('POST /api/auth/login - Admin Login', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@bankportal.com',
                password: 'Password@123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.role).toBe('admin');
        adminToken = res.body.token;
    });

    test('POST /api/auth/login - Customer Login', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'rajesh.kumar@example.com',
                password: 'Password@123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.role).toBe('customer');
        customerToken = res.body.token;
    });

    test('POST /api/transactions/deposit - Deposit Money', async () => {
        const res = await request(app)
            .post('/api/transactions/deposit')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                account_number: accountNumber,
                amount: 5000,
                description: 'Test Deposit'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.reference_number).toBeDefined();
    });

    test('POST /api/transactions/withdraw - Minimum Balance Violation Enforcement', async () => {
        // Attempt to withdraw an excessive amount that would drop balance below ₹1000
        const res = await request(app)
            .post('/api/transactions/withdraw')
            .set('Authorization', `Bearer ${customerToken}`)
            .send({
                account_number: accountNumber,
                amount: 99999999,
                description: 'Excessive withdrawal test'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Insufficient funds');
    });

    test('GET /api/admin/dashboard - Admin Access Allowed', async () => {
        const res = await request(app)
            .get('/api/admin/dashboard')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.analytics).toBeDefined();
    });

    test('GET /api/admin/dashboard - Customer Access Forbidden', async () => {
        const res = await request(app)
            .get('/api/admin/dashboard')
            .set('Authorization', `Bearer ${customerToken}`);

        expect(res.statusCode).toBe(403);
        expect(res.body.success).toBe(false);
    });
});
