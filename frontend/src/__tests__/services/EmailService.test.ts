import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { sendAdminReport, sendUserReport } from '../../services/EmailService';
import { env } from '../../env';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default environment
    env.VITE_CHES_FROM_EMAIL = 'test@gov.bc.ca';
    env.VITE_CHES_ADMIN_EMAIL = 'admin@gov.bc.ca';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendUserReport', () => {
    it('should send user report email', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: 'success' });

      const result = await sendUserReport('John Doe', 'john@example.com', 75, 'Test A');

      expect(result).toBe('success');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/mail',
        expect.objectContaining({
          fromEmail: 'test@gov.bc.ca',
          toEmails: ['john@example.com'],
          subject: 'Test A user attempt report : John Doe',
          mailBody: expect.stringContaining('John Doe'),
        }),
        expect.objectContaining({}),
      );
    });

    it('should return error when email sending fails', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendUserReport('John Doe', 'john@example.com', 75, 'Test A');

      expect(result).toBe('error');
    });

    it('should include online access request form link for passing users', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: 'success' });

      await sendUserReport('John Doe', 'john@example.com', 75, 'Test A');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/mail',
        expect.objectContaining({
          mailBody: expect.stringContaining(
            'https://extranet.for.gov.bc.ca/escripts/efm/access/results/access.asp',
          ),
        }),
        expect.objectContaining({}),
      );
    });

    it('should not include online access request form link for failing users', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: 'success' });

      await sendUserReport('John Doe', 'john@example.com', 40, 'Test A');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/mail',
        expect.objectContaining({
          mailBody: expect.not.stringContaining(
            'https://extranet.for.gov.bc.ca/escripts/efm/access/results/access.asp',
          ),
        }),
        expect.objectContaining({}),
      );
    });
  });

  describe('sendAdminReport', () => {
    const testResults = [
      {
        question: 'What is 2+2?',
        userAnswered: '4',
        answer: '4',
        isCorrect: true,
      },
    ];

    it('should send admin report email in PROD environment', async () => {
      env.VITE_ZONE = 'prod';
      mockedAxios.post.mockResolvedValueOnce({ data: 'success' });

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults,
      );

      expect(result).toBe('success');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/mail',
        expect.objectContaining({
          fromEmail: 'test@gov.bc.ca',
          toEmails: ['admin@gov.bc.ca'],
          subject: 'Test A admin report : John Doe',
        }),
        expect.objectContaining({}),
      );
    });

    it('should send admin report email in TEST environment to test taker', async () => {
      env.VITE_ZONE = 'test';
      mockedAxios.post.mockResolvedValueOnce({ data: 'success' });

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults,
      );

      expect(result).toBe('success');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/mail',
        expect.objectContaining({
          fromEmail: 'test@gov.bc.ca',
          toEmails: ['john@example.com'],
          subject: 'Test A admin report : John Doe',
        }),
        expect.objectContaining({}),
      );
    });

    it('should NOT send admin report email in PR environment (numeric zone)', async () => {
      env.VITE_ZONE = '123';

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults,
      );

      expect(result).toBe('success');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should NOT send admin report email in PR environment (pr-prefix zone)', async () => {
      env.VITE_ZONE = 'pr-456';

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults,
      );

      expect(result).toBe('success');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should NOT send admin report email in DEV environment', async () => {
      env.VITE_ZONE = 'dev';

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults,
      );

      expect(result).toBe('success');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive environment names for PROD', async () => {
      env.VITE_ZONE = 'PROD';
      mockedAxios.post.mockResolvedValueOnce({ data: 'success' });

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults,
      );

      expect(result).toBe('success');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/mail',
        expect.objectContaining({
          fromEmail: 'test@gov.bc.ca',
          toEmails: ['admin@gov.bc.ca'],
          subject: 'Test A admin report : John Doe',
        }),
        expect.objectContaining({}),
      );
    });

    it('should handle case-insensitive environment names for TEST', async () => {
      env.VITE_ZONE = 'TEST';
      mockedAxios.post.mockResolvedValueOnce({ data: 'success' });

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults,
      );

      expect(result).toBe('success');
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/mail',
        expect.objectContaining({
          fromEmail: 'test@gov.bc.ca',
          toEmails: ['john@example.com'],
          subject: 'Test A admin report : John Doe',
        }),
        expect.objectContaining({}),
      );
    });

    it('should return error when email sending fails in PROD', async () => {
      env.VITE_ZONE = 'prod';
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults,
      );

      expect(result).toBe('error');
    });
  });
});
