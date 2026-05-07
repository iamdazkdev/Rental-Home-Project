const request = require('supertest');
const app = require('../app');

describe('Health Check API', () => {
  it('should return 200 and running status for /health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Rento Server is running');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('dbStatus');
    expect(res.body).toHaveProperty('timestamp');
  });
});
