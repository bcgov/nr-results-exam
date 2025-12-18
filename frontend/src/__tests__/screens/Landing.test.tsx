import React from 'react';
import Landing from '../../screens/Landing';
import { describe, expect, it, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useLottie } from 'lottie-react';
import { AuthProvider, useAuth } from '../../contexts/AuthProvider';

// Mock useLottie to control the lottie animation
vi.mock('lottie-react', () => ({
  useLottie: vi.fn(),
}));

// Mock AuthProvider to control the user state
vi.mock('../../contexts/AuthProvider', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: vi.fn(),
}));

const renderComponent = () => {
  render(<Landing />);
};

describe('Landing', () => {
  beforeAll(() => {
    // Mock useLottie
    (useLottie as ReturnType<typeof vi.fn>).mockReturnValue({
      View: <div data-testid="lottie-view"></div>,
    });
  });
  it('should show "Welcome to RESULTS EXAM" as the title', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: null }); // Mock user as null (loading state)
    renderComponent();
    expect(screen.getByTestId('landing-title')).toHaveTextContent('Welcome to RESULTS EXAM');
  });
});
