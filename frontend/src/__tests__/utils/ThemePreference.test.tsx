import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ThemePreference, useThemePreference } from '../../utils/ThemePreference';

type MockMediaQueryList = MediaQueryList & {
  dispatchChange: (matches: boolean) => void;
};

const ThemeConsumer = () => {
  const { theme, setTheme } = useThemePreference();

  return (
    <button
      data-testid="current-theme"
      onClick={() => setTheme(theme === 'g100' ? 'g10' : 'g100')}
      type="button"
    >
      {theme}
    </button>
  );
};

const renderWithProvider = (children?: React.ReactElement) =>
  render(<ThemePreference>{children ?? <ThemeConsumer />}</ThemePreference>);

function createMatchMedia(matches: boolean): MockMediaQueryList {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mock: MockMediaQueryList = {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_eventName, handler) => {
      listeners.add(handler);
    },
    removeEventListener: (_eventName, handler) => {
      listeners.delete(handler);
    },
    dispatchEvent: () => false,
    addListener: (handler: (event: MediaQueryListEvent) => void) => {
      listeners.add(handler);
    },
    removeListener: (handler: (event: MediaQueryListEvent) => void) => {
      listeners.delete(handler);
    },
    dispatchChange: (nextMatches: boolean) => {
      mock.matches = nextMatches;
      listeners.forEach((listener) => listener({ matches: nextMatches } as MediaQueryListEvent));
    },
  } as MockMediaQueryList;

  return mock;
}

describe('ThemePreference', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let mockMediaQuery: MockMediaQueryList;

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    localStorage.clear();
    document.documentElement.removeAttribute('data-carbon-theme');
    document.documentElement.removeAttribute('data-bs-theme');

    mockMediaQuery = createMatchMedia(false);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => mockMediaQuery),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.matchMedia = originalMatchMedia;
  });

  test('uses stored theme when available', () => {
    localStorage.setItem('theme', 'g100');

    renderWithProvider();

    expect(screen.getByTestId('current-theme')).toHaveTextContent('g100');
    expect(document.documentElement.getAttribute('data-carbon-theme')).toBe('g100');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
  });

  test('falls back to system preference and responds to changes', async () => {
    mockMediaQuery.matches = true;

    renderWithProvider();

    expect(screen.getByTestId('current-theme')).toHaveTextContent('g100');

    await act(async () => {
      mockMediaQuery.dispatchChange(false);
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('g10');
    });
    expect(localStorage.getItem('theme')).toBe('g10');
  });

  test('updates theme when toggled via context', async () => {
    renderWithProvider();

    const toggle = screen.getByTestId('current-theme');

    await userEvent.click(toggle);

    await waitFor(() => {
      expect(toggle).toHaveTextContent('g100');
    });
    expect(document.documentElement.getAttribute('data-carbon-theme')).toBe('g100');
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('g100');
  });
});
