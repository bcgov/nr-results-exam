import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import BCHeaderwSide from '../../components/BCHeaderwSide';
import '@testing-library/jest-dom';
import { AuthProvider } from '../../contexts/AuthProvider';
import { ThemePreference } from '../../utils/ThemePreference';

const renderComponent = async () => {

  await act(() => render(
    <ThemePreference>
      <AuthProvider>
          <BrowserRouter>
            <BCHeaderwSide />
          </BrowserRouter>
      </AuthProvider>
    </ThemePreference>
  ));
};

describe('BCHeaderwSide', async () => {
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

  it('should render the component', async () => {
    await renderComponent();
    expect(await screen.findByTestId('header')).toBeInTheDocument();
  });

  it('should renders the site name', async () => {
    renderComponent();
    screen.debug();
    expect(screen.getByText('RESULTS EXAM')).toBeDefined();
  });

  it('opens and closes the My Profile panel', async () => {
    renderComponent();
    const userSettingsButton = screen.getByTestId('header-button__user');
    fireEvent.click(userSettingsButton);
    expect(screen.getByText('My Profile')).toBeDefined();
    fireEvent.click(userSettingsButton);
    // expect(screen.queryByText('My Profile')).not.toBeVisible();
  });

});

