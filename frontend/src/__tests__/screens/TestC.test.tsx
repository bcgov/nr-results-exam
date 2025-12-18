import React from 'react';
import TestC from '../../screens/TestC';
import { describe, expect, it, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../contexts/AuthProvider';
import { BrowserRouter } from 'react-router-dom';

// Mock AuthProvider to control the user state
vi.mock('../../contexts/AuthProvider', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: vi.fn(),
}));

const renderComponent = () => {
  render(
    <AuthProvider>
      <BrowserRouter>
        <TestC />
      </BrowserRouter>
    </AuthProvider>,
  );
};

describe('TestA', () => {
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

  it('should show "Null" when the user info is not set initially', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: null }); // Mock user as null (loading state)
    renderComponent();
    expect(screen.getByText('Null')).toBeInTheDocument();
  });
  it('should display loading even when user is logged in but the questions have not been fetched', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        firstName: 'John',
        lastName: 'Doe',
        userName: 'jdoe',
        email: 'john.doe@bc.ca',
      },
    });
    renderComponent();
    expect(screen.getByText('loading')).toBeInTheDocument();
  });
});
