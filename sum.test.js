const supertest = require('supertest');
const app = require('./app');
const mongoose = require('mongoose');

beforeEach(async () => {
    await mongoose.connect(process.env.DATABASE_URI);
  });
  
  /* Closing database connection after each test. */
  
describe('GET /statistics', () => {
    it('should return a json with totalDevices and numberOfUsers ', async () => {
        const response = await supertest(app)
        .get('/statistics')
        expect(response.statusCode).toBe(200);
    
        expect(response.body).toHaveProperty('totalDevices');
        expect(response.body).toHaveProperty('totalUsers');
        expect(response.body).toHaveProperty('_id');
    });
    });
    afterEach(async () => {
        await mongoose.connection.close();
      });