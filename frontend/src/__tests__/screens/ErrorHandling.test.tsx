import React from 'react';
import ErrorHandling from '../../screens/ErrorHandling';
import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { ThemePreference } from '../../utils/ThemePreference';
import { BrowserRouter, useRouteError } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

const renderComponent = () =>
  render(
    <ThemePreference>
      <BrowserRouter>
        <ErrorHandling />
      </BrowserRouter>
    </ThemePreference>,
  );

// Mock useRouteError to control the error state
vi.mock('react-router-dom', () => ({
  isRouteErrorResponse: vi.fn(),
  BrowserRouter: ({ children }) => <>{children}</>,
  useRouteError: vi.fn(),
}));

describe('ErrorHandling', () => {
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
  it('should render the ErrorHandling component', () => {
    //mock useRouteError to return a 404 error
    (useRouteError as ReturnType<typeof vi.fn>).mockReturnValue({
      status: 404,
    });
    renderComponent();
    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
  });
});
