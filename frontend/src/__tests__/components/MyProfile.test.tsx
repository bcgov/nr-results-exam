import React from 'react';
import MyProfile from '../../components/MyProfile';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../contexts/AuthProvider';
import { ThemePreference, useThemePreference } from '../../utils/ThemePreference';
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
    </ThemePreference>,
  );
};

// Mock useAuth to control the user state
vi.mock('../../contexts/AuthProvider', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: vi.fn(),
}));

vi.mock('../../utils/ThemePreference', async () => {
  const actual = await vi.importActual<typeof import('../../utils/ThemePreference')>(
    '../../utils/ThemePreference',
  );
  return {
    ...actual,
    ThemePreference: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useThemePreference: vi.fn(),
  };
});

describe('MyProfile', () => {
  let mockedUseThemePreference: vi.Mock;
  beforeAll(() => {
    // Mock matchMedia
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

  beforeEach(() => {
    mockedUseThemePreference = useThemePreference as unknown as vi.Mock;
    mockedUseThemePreference.mockReset();
    mockedUseThemePreference.mockReturnValue({
      theme: 'g10',
      setTheme: vi.fn(),
    });
  });

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
    expect(screen.getByText('Email: john.doe@example.com')).toBeInTheDocument();
  });

  it('switches from light to dark theme', () => {
    const setTheme = vi.fn();
    mockedUseThemePreference.mockReturnValue({
      theme: 'g10',
      setTheme,
    });

    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        firstName: 'John',
        lastName: 'Doe',
        userName: 'jdoe',
        email: 'john.doe@example.com',
      },
      logout: vi.fn(),
    });

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderComponent();

    fireEvent.click(screen.getByText('Change theme'));

    expect(setTheme).toHaveBeenCalledWith('g100');
    expect(setItemSpy).toHaveBeenCalledWith('mode', 'dark');
    setItemSpy.mockRestore();
  });

  it('switches from dark to light theme', () => {
    const setTheme = vi.fn();
    mockedUseThemePreference.mockReturnValue({
      theme: 'g100',
      setTheme,
    });

    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        firstName: 'Jane',
        lastName: 'Smith',
        userName: 'jsmith',
        email: 'jane.smith@example.com',
      },
      logout: vi.fn(),
    });

    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    renderComponent();

    fireEvent.click(screen.getByText('Change theme'));

    expect(setTheme).toHaveBeenCalledWith('g10');
    expect(setItemSpy).toHaveBeenCalledWith('mode', 'light');
    setItemSpy.mockRestore();
  });
});
