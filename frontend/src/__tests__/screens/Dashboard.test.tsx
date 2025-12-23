import React from 'react';
import Dashboard from '../../screens/Dashboard';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthProvider';

// Mock useAuth to control the user state
vi.mock('../../contexts/AuthProvider', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: vi.fn(),
}));

const renderComponent = () => {
  render(
    <AuthProvider>
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    </AuthProvider>,
  );
};

describe('Dashboard', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('should render the component', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: null }); // Mock user as null (loading state)
    renderComponent();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display user details when user is available', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        firstName: 'John',
        lastName: 'Doe',
        userName: 'jdoe',
        email: 'john.doe@bc.ca',
      },
    });
    renderComponent();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
  it('should display all the three cards', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        firstName: 'John',
        lastName: 'Doe',
        userName: 'jdoe',
        email: 'john.doe@bc.ca',
      },
    });
    renderComponent();
    expect(screen.getByTestId('card-a')).toBeInTheDocument();
    expect(screen.getByTestId('card-b')).toBeInTheDocument();
    expect(screen.getByTestId('card-c')).toBeInTheDocument();
  });
});
