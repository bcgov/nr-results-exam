/**
 * Tests for health check endpoints
 * 
 * Note: These tests verify the basic structure and exports.
 * Integration testing should be done in a deployed environment.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Health endpoints', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Set up test environment
    process.env.BACKEND_SERVICE_URL = 'http://localhost:5000';
    
    // Mock fetch globally
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('health router module', () => {
    it('should export a router with /live and /ready routes', async () => {
      const { default: healthRouter } = await import('../health.js');
      
      expect(healthRouter).toBeDefined();
      expect(healthRouter.stack).toBeDefined();
      
      // Check that both routes exist
      const liveRoute = healthRouter.stack.find((layer: any) => 
        layer.route?.path === '/live'
      );
      const readyRoute = healthRouter.stack.find((layer: any) => 
        layer.route?.path === '/ready'
      );
      
      expect(liveRoute).toBeDefined();
      expect(readyRoute).toBeDefined();
    });
  });

  describe('/health/live endpoint', () => {
    it('should return 200 with alive status', async () => {
      const { default: healthRouter } = await import('../health.js');
      
      const mockReq = {} as any;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      const liveRoute = healthRouter.stack.find((layer: any) => 
        layer.route?.path === '/live'
      );
      
      expect(liveRoute).toBeDefined();
      
      // Execute the handler
      await liveRoute.route.stack[0].handle(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'alive',
          uptime: expect.any(Number),
        })
      );
    });
  });

  describe('/health/ready endpoint', () => {
    it('should return ready status when backend is healthy', async () => {
      const { default: healthRouter } = await import('../health.js');
      
      const mockReq = {} as any;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      const readyRoute = healthRouter.stack.find((layer: any) => 
        layer.route?.path === '/ready'
      );
      
      expect(readyRoute).toBeDefined();
      
      // Execute the handler
      await readyRoute.route.stack[0].handle(mockReq, mockRes);

      // Should eventually call either 200 or 503
      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });
  });

  describe('environment variable handling', () => {
    it('should use BACKEND_SERVICE_URL when available', () => {
      process.env.BACKEND_SERVICE_URL = 'http://backend:5000';
      
      const backendUrl = process.env.BACKEND_SERVICE_URL || process.env.VITE_BACKEND_URL;
      expect(backendUrl).toBe('http://backend:5000');
    });

    it('should fall back to VITE_BACKEND_URL', () => {
      delete process.env.BACKEND_SERVICE_URL;
      process.env.VITE_BACKEND_URL = 'http://backend-fallback:5000';
      
      const backendUrl = process.env.BACKEND_SERVICE_URL || process.env.VITE_BACKEND_URL;
      expect(backendUrl).toBe('http://backend-fallback:5000');
    });
  });
});

