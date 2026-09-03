const request = require('supertest');
const app = require('../server');

describe('API Smoke and Health Tests', () => {
  test('GET /api/health should return healthy status and service name', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toContain('BidWise AI');
  });

  test('POST /api/auth/register should validate required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' }); // missing name and password

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/demo/seed should return a structured demo environment token', async () => {
    // Note: If DB is connected or in test mode, this tests endpoint response schema
    const res = await request(app).post('/api/demo/seed');
    // Accepts 200 (if DB connected) or 503 (if local test DB not connected during isolated unit test)
    expect([200, 503]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.tenderId).toBeDefined();
    }
  });
});
