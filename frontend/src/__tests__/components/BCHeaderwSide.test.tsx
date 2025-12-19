import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeAll, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BCHeaderwSide from '../../components/BCHeaderwSide';
import { AuthProvider } from '../../contexts/AuthProvider';
import { ThemePreference } from '../../utils/ThemePreference';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock
  };
});

vi.mock('@carbon/icons-react', async () => {
  const actual = await vi.importActual<typeof import('@carbon/icons-react')>('@carbon/icons-react');
  return {
    ...actual,
    Home: () => <svg data-testid="icon-home" />,
    Dashboard: () => <svg data-testid="icon-dashboard" />,
    UserAvatar: () => <svg data-testid="icon-avatar" />
  };
});

const renderComponent = () => render(
  <ThemePreference>
    <AuthProvider>
      <MemoryRouter>
        <BCHeaderwSide />
      </MemoryRouter>
    </AuthProvider>
  </ThemePreference>
);

describe('BCHeaderwSide', () => {
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

  beforeEach(() => {
    navigateMock.mockReset();
    window.history.replaceState({}, '', '/');
  });

  it('renders the header with site name', () => {
    renderComponent();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByText('RESULTS EXAM')).toBeInTheDocument();
  });

  it('opens and closes the My Profile panel', async () => {
    renderComponent();
    const userSettingsButton = screen.getByTestId('header-button__user');
    const panel = screen.getByLabelText('User Profile Tab');

    await act(async () => {
      fireEvent.click(userSettingsButton);
    });

    await act(async () => {
      fireEvent.click(userSettingsButton);
    });

    const closeButton = panel.querySelector<HTMLButtonElement>('button.cds--btn--ghost');
    expect(closeButton).not.toBeNull();
    await act(async () => {
      fireEvent.click(closeButton!);
    });
  });

  it('navigates when a side navigation link is selected', async () => {
    renderComponent();

    fireEvent.click(screen.getByText('Home'));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard');
    });
  });
});

