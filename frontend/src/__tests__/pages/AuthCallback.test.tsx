import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, beforeEach, expect, test, vi } from 'vitest';

const mockNavigate = vi.fn();
const mockHandleCallback = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../services/keycloak', () => ({
  handleCallback: () => mockHandleCallback(),
}));

import AuthCallback from '../../pages/AuthCallback';

describe('AuthCallback component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('completes auth exchange and navigates to dashboard', async () => {
    mockHandleCallback.mockResolvedValueOnce({ access_token: 'test' });

    render(<AuthCallback />);

    expect(screen.getByText('Completing login...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockHandleCallback).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  test('guards against StrictMode double-mount so handleCallback is only called once', async () => {
    mockHandleCallback.mockResolvedValue({ access_token: 'test' });

    render(
      <React.StrictMode>
        <AuthCallback />
      </React.StrictMode>,
    );

    await waitFor(() => {
      expect(mockHandleCallback).toHaveBeenCalledTimes(1);
    });
  });

  test('handles callback error, displays failure message, and redirects home after timeout', async () => {
    vi.useFakeTimers();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockHandleCallback.mockRejectedValueOnce(new Error('Invalid code'));

    const { unmount } = render(<AuthCallback />);

    await vi.waitFor(() => {
      expect(screen.getByText('Authentication failed. Returning to login...')).toBeInTheDocument();
    });

    vi.advanceTimersByTime(2000);
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });

    unmount();
    errorSpy.mockRestore();
    vi.useRealTimers();
  });
});
