import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BCHeader from '../../components/BCHeader';
import '@testing-library/jest-dom';
import { useThemePreference } from '../../utils/ThemePreference';
import { toggleTheme } from '../../utils/ThemeFunction';

vi.mock('../../utils/ThemePreference', () => ({
  useThemePreference: vi.fn(),
}));

vi.mock('../../utils/ThemeFunction', () => ({
  toggleTheme: vi.fn(),
}));

//mock the matchMedia function to have a dark theme
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
});

describe('BC Header component tests', () => {
  const mockedUseThemePreference = useThemePreference as unknown as vi.Mock;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <BCHeader />
    </MemoryRouter>
  );

  it('renders with the light theme and toggles to dark', () => {
    const setTheme = vi.fn();
    mockedUseThemePreference.mockReturnValue({
      theme: 'g10',
      setTheme
    });

    const { getByTestId } = renderComponent();

    expect(getByTestId('header')).toHaveClass('results-exam-header');
    const themeToggle = screen.getByLabelText('Switch to Dark Mode');
    fireEvent.click(themeToggle);

    expect(toggleTheme).toHaveBeenCalledWith('g10', setTheme);
  });

  it('renders with the dark theme and toggles back to light', () => {
    const setTheme = vi.fn();
    mockedUseThemePreference.mockReturnValue({
      theme: 'g100',
      setTheme
    });

    renderComponent();

    const themeToggle = screen.getByLabelText('Switch to Light Mode');
    fireEvent.click(themeToggle);

    expect(toggleTheme).toHaveBeenCalledWith('g100', setTheme);
  });
});
