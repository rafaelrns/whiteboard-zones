import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from './app';

// Nota: teste smoke sem auth real (dependeria de Redis/DB).
// Mantemos aqui apenas para garantir que a rota foi registrada.
describe('routes', () => {
  it('has /health', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});
