import React from 'react';
import MyProfile from '../../components/MyProfile';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../../contexts/AuthProvider';
import { ThemePreference } from '../../utils/ThemePreference';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

const renderComponent = () => {
  render(
    <ThemePreference>
      <AuthProvider>
        <BrowserRouter>
          <MyProfile />
        </BrowserRouter>
      </AuthProvider>
    </ThemePreference>
  );
};

// Mock useAuth to control the user state
vi.mock('../../contexts/AuthProvider', () => ({
    AuthProvider: ({ children }) => <>{children}</>,
    useAuth: vi.fn(),
  }));

describe('MyProfile', () => {
    beforeAll(() => {
        // Mock matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: query === '(prefers-color-scheme: dark)',
                media: query,
                onchange: null,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            }))
        });
    }
    );

    it('should show "Loading user details" when the user info is not set initially', () => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: null }); // Mock user as null (loading state)
        renderComponent();
        expect(screen.getByText('Loading user details')).toBeInTheDocument();
      });
    
      it('should display user details when user is available', () => {
        (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
          user: {
            firstName: 'John',
            lastName: 'Doe',
            userName: 'jdoe',
            email: 'john.doe@example.com',
          },
          logout: vi.fn(),
        });
    
        renderComponent();
    
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('IDIR: jdoe')).toBeInTheDocument();
        expect(screen.getByText('Email:john.doe@example.com')).toBeInTheDocument();
      });

});