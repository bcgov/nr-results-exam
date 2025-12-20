import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Mock } from 'vitest';

import ProtectedRoute from '../../routes/ProtectedRoute';
import { useAuth } from '../../contexts/AuthProvider';

vi.mock('../../contexts/AuthProvider', () => ({
  useAuth: vi.fn(),
}));

type MockAuthState = {
  user: undefined;
  userRoles: undefined;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
};

const mockedUseAuth = useAuth as unknown as Mock;

const createAuthState = (overrides?: Partial<MockAuthState>): MockAuthState => ({
  user: undefined,
  userRoles: undefined,
  isLoggedIn: false,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  ...overrides,
});

const renderWithRoutes = () =>
  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<ProtectedRoute redirectTo="/login" />}>
          <Route path="/protected" element={<div>Secure Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('redirects unauthenticated users and triggers logout', () => {
    const authState = createAuthState({ isLoggedIn: false });
    mockedUseAuth.mockReturnValue(authState);

    renderWithRoutes();

    expect(authState.logout).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('renders outlet when user is authenticated', () => {
    const authState = createAuthState({ isLoggedIn: true });
    mockedUseAuth.mockReturnValue(authState);

    renderWithRoutes();

    expect(authState.logout).not.toHaveBeenCalled();
    expect(screen.getByText('Secure Content')).toBeInTheDocument();
  });
});
