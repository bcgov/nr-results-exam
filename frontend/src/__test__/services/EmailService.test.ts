import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { sendAdminReport, sendUserReport } from '../../services/EmailService'
import { env } from '../../env'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default environment
    env.VITE_BACKEND_URL = 'http://localhost:3000'
    env.VITE_CHES_FROM_EMAIL = 'test@gov.bc.ca'
    env.VITE_CHES_ADMIN_EMAIL = 'admin@gov.bc.ca'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('sendUserReport', () => {
    it('should send user report email', async () => {
      mockedAxios.post.mockResolvedValueOnce({ data: 'success' })

      const result = await sendUserReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A'
      )

      expect(result).toBe('success')
      expect(mockedAxios.post).toHaveBeenCalledTimes(1)
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/mail',
        expect.objectContaining({
          fromEmail: 'test@gov.bc.ca',
          toEmails: ['john@example.com'],
          subject: 'Test A user attempt report : John Doe',
          mailBody: expect.stringContaining('John Doe')
        })
      )
    })

    it('should return error when email sending fails', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'))

      const result = await sendUserReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A'
      )

      expect(result).toBe('error')
    })
  })

  describe('sendAdminReport', () => {
    const testResults = [
      {
        question: 'What is 2+2?',
        userAnswered: '4',
        answer: '4',
        isCorrect: true
      }
    ]

    it('should send admin report email in PROD environment', async () => {
      env.VITE_ZONE = 'prod'
      mockedAxios.post.mockResolvedValueOnce({ data: 'success' })

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults
      )

      expect(result).toBe('success')
      expect(mockedAxios.post).toHaveBeenCalledTimes(1)
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/mail',
        expect.objectContaining({
          fromEmail: 'test@gov.bc.ca',
          toEmails: ['admin@gov.bc.ca'],
          subject: 'Test A admin report : John Doe'
        })
      )
    })

    it('should send admin report email in TEST environment to test taker', async () => {
      env.VITE_ZONE = 'test'
      mockedAxios.post.mockResolvedValueOnce({ data: 'success' })

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults
      )

      expect(result).toBe('success')
      expect(mockedAxios.post).toHaveBeenCalledTimes(1)
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/mail',
        expect.objectContaining({
          fromEmail: 'test@gov.bc.ca',
          toEmails: ['john@example.com'],
          subject: 'Test A admin report : John Doe'
        })
      )
    })

    it('should NOT send admin report email in PR environment (numeric zone)', async () => {
      env.VITE_ZONE = '123'
      const consoleLogSpy = vi.spyOn(console, 'log')

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults
      )

      expect(result).toBe('success')
      expect(mockedAxios.post).not.toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Admin report email skipped for environment: 123 (only sent in prod or test)'
      )
    })

    it('should NOT send admin report email in PR environment (pr-prefix zone)', async () => {
      env.VITE_ZONE = 'pr-456'
      const consoleLogSpy = vi.spyOn(console, 'log')

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults
      )

      expect(result).toBe('success')
      expect(mockedAxios.post).not.toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Admin report email skipped for environment: pr-456 (only sent in prod or test)'
      )
    })

    it('should NOT send admin report email in DEV environment', async () => {
      env.VITE_ZONE = 'dev'
      const consoleLogSpy = vi.spyOn(console, 'log')

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults
      )

      expect(result).toBe('success')
      expect(mockedAxios.post).not.toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Admin report email skipped for environment: dev (only sent in prod or test)'
      )
    })

    it('should handle case-insensitive environment names for PROD', async () => {
      env.VITE_ZONE = 'PROD'
      mockedAxios.post.mockResolvedValueOnce({ data: 'success' })

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults
      )

      expect(result).toBe('success')
      expect(mockedAxios.post).toHaveBeenCalledTimes(1)
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/mail',
        expect.objectContaining({
          fromEmail: 'test@gov.bc.ca',
          toEmails: ['admin@gov.bc.ca'],
          subject: 'Test A admin report : John Doe'
        })
      )
    })

    it('should handle case-insensitive environment names for TEST', async () => {
      env.VITE_ZONE = 'TEST'
      mockedAxios.post.mockResolvedValueOnce({ data: 'success' })

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults
      )

      expect(result).toBe('success')
      expect(mockedAxios.post).toHaveBeenCalledTimes(1)
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3000/api/mail',
        expect.objectContaining({
          fromEmail: 'test@gov.bc.ca',
          toEmails: ['john@example.com'],
          subject: 'Test A admin report : John Doe'
        })
      )
    })

    it('should return error when email sending fails in PROD', async () => {
      env.VITE_ZONE = 'prod'
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'))

      const result = await sendAdminReport(
        'John Doe',
        'john@example.com',
        75,
        'Test A',
        testResults
      )

      expect(result).toBe('error')
    })
  })
})
