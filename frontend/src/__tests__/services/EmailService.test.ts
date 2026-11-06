import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendAdminReport, sendUserReport } from '../../services/EmailService';
import { env } from '../../env';

const fetchMock = vi.fn();
const okResponse = { ok: true, status: 200 };
const serverError = { ok: false, status: 500 };

const sentMail = () => {
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe('/api/mail');
  expect(init.method).toBe('POST');
  expect(init.headers['Content-Type']).toBe('application/json');
  return JSON.parse(init.body);
};

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    // Setup default environment
    env.VITE_CHES_FROM_EMAIL = 'test@gov.bc.ca';
    env.VITE_CHES_ADMIN_EMAIL = 'admin@gov.bc.ca';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('sendUserReport', () => {
    it('should send user report email', async () => {
      fetchMock.mockResolvedValueOnce(okResponse);

      const result = await sendUserReport('John Doe', 'john@example.com', 75, 'Test A');

      expect(result).toBe('success');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(sentMail()).toMatchObject({
        fromEmail: 'test@gov.bc.ca',
        toEmails: ['john@example.com'],
        subject: 'Test A user attempt report : John Doe',
        mailBody: expect.stringContaining('John Doe'),
      });
    });

    it('should return error when email sending fails', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendUserReport('John Doe', 'john@example.com', 75, 'Test A');

      expect(result).toBe('error');
    });

    it('should return error when the server responds with a failure status', async () => {
      fetchMock.mockResolvedValueOnce(serverError);

      const result = await sendUserReport('John Doe', 'john@example.com', 75, 'Test A');

      expect(result).toBe('error');
    });

    it('should include online access request form link for passing users', async () => {
      fetchMock.mockResolvedValueOnce(okResponse);

      await sendUserReport('John Doe', 'john@example.com', 75, 'Test A');

      expect(sentMail()).toMatchObject({
        mailBody: expect.stringContaining(
          'https://extranet.for.gov.bc.ca/escripts/efm/access/results/access.asp',
        ),
      });
    });

    it('should not include online access request form link for failing users', async () => {
      fetchMock.mockResolvedValueOnce(okResponse);

      await sendUserReport('John Doe', 'john@example.com', 40, 'Test A');

      expect(fetchMock).toHaveBeenCalled();
      const payload = sentMail();
      expect(payload.mailBody).not.toContain(
        'https://extranet.for.gov.bc.ca/escripts/efm/access/results/access.asp',
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
      fetchMock.mockResolvedValueOnce(okResponse);

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults,
      );

      expect(result).toBe('success');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(sentMail()).toMatchObject({
        fromEmail: 'test@gov.bc.ca',
        toEmails: ['admin@gov.bc.ca'],
        subject: 'Test A admin report : John Doe',
      });
    });

    it('should send admin report email in TEST environment to test taker', async () => {
      env.VITE_ZONE = 'test';
      fetchMock.mockResolvedValueOnce(okResponse);

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults,
      );

      expect(result).toBe('success');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(sentMail()).toMatchObject({
        fromEmail: 'test@gov.bc.ca',
        toEmails: ['john@example.com'],
        subject: 'Test A admin report : John Doe',
      });
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
      expect(fetchMock).not.toHaveBeenCalled();
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
      expect(fetchMock).not.toHaveBeenCalled();
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
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('should handle case-insensitive environment names for PROD', async () => {
      env.VITE_ZONE = 'PROD';
      fetchMock.mockResolvedValueOnce(okResponse);

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults,
      );

      expect(result).toBe('success');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(sentMail()).toMatchObject({
        fromEmail: 'test@gov.bc.ca',
        toEmails: ['admin@gov.bc.ca'],
        subject: 'Test A admin report : John Doe',
      });
    });

    it('should handle case-insensitive environment names for TEST', async () => {
      env.VITE_ZONE = 'TEST';
      fetchMock.mockResolvedValueOnce(okResponse);

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults,
      );

      expect(result).toBe('success');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(sentMail()).toMatchObject({
        fromEmail: 'test@gov.bc.ca',
        toEmails: ['john@example.com'],
        subject: 'Test A admin report : John Doe',
      });
    });

    it('should return error when email sending fails in PROD', async () => {
      env.VITE_ZONE = 'prod';
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults,
      );

      expect(result).toBe('error');
    });

    it('should return error when the server responds with a failure status in PROD', async () => {
      env.VITE_ZONE = 'prod';
      fetchMock.mockResolvedValueOnce(serverError);

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
