import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, vitest } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import BCHeader from '../../components/BCHeader';
import '@testing-library/jest-dom';
import { ThemePreference } from '../../utils/ThemePreference';

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
const renderComponent = () => {
  return render(
    <BrowserRouter>
      <ThemePreference>
        <BCHeader />
      </ThemePreference>
    </BrowserRouter>
  );
}

describe('BC Header component tests', () => {
  it('should have a Header with proper class name', async () => {
    const { getByTestId } = renderComponent();
    const header = getByTestId('header');
    await waitFor(() => {
      expect(header).toHaveClass('results-exam-header');
    });
  });
});
