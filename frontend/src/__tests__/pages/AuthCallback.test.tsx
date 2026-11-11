import { render, screen, waitFor } from '@testing-library/react';
import { describe, beforeEach, expect, test, vi } from 'vitest';

const mockNavigate = vi.fn();
const mockRefreshUserState = vi.fn();
const mockHandleCallback = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../services/keycloak', () => ({
  handleCallback: () => mockHandleCallback(),
}));

vi.mock('../../contexts/AuthProvider', () => ({
  useAuth: () => ({
    refreshUserState: mockRefreshUserState,
  }),
}));

import AuthCallback from '../../pages/AuthCallback';

describe('AuthCallback component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('completes auth exchange, refreshes state, and navigates to dashboard', async () => {
    mockHandleCallback.mockResolvedValueOnce({ access_token: 'test' });
    mockRefreshUserState.mockResolvedValueOnce(undefined);

    render(<AuthCallback />);

    expect(screen.getByText('Completing login...')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockHandleCallback).toHaveBeenCalledTimes(1);
      expect(mockRefreshUserState).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });

  test('guards against double-mount so handleCallback is only called once', async () => {
    mockHandleCallback.mockResolvedValue({ access_token: 'test' });
    mockRefreshUserState.mockResolvedValue(undefined);

    const { rerender } = render(<AuthCallback />);
    rerender(<AuthCallback />);

    await waitFor(() => {
      expect(mockHandleCallback).toHaveBeenCalledTimes(1);
    });
  });

  test('handles callback error and displays failure message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockHandleCallback.mockRejectedValueOnce(new Error('Invalid code'));

    render(<AuthCallback />);

    await waitFor(() => {
      expect(screen.getByText('Authentication failed. Returning to login...')).toBeInTheDocument();
    });
  });
});
