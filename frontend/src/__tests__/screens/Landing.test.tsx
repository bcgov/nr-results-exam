import React from 'react';
import Landing from '../../screens/Landing';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useAuth } from '../../contexts/AuthProvider';

// Mock Lottie component
vi.mock('lottie-react', () => ({
  Lottie: () => <div data-testid="lottie-view" />,
}));

// Mock AuthProvider to control the user state
vi.mock('../../contexts/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: vi.fn(),
}));

const renderComponent = () => {
  render(<Landing />);
};

describe('Landing', () => {
  it('should show "Welcome to RESULTS EXAM" as the title', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ user: null }); // Mock user as null (loading state)
    renderComponent();
    expect(screen.getByTestId('landing-title')).toHaveTextContent('Welcome to RESULTS EXAM');
  });
});
