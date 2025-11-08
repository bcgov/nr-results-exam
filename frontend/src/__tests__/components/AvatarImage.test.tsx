import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AvatarImage from '../../components/AvatarImage';
import '@testing-library/jest-dom';

describe('AvatarImage component tests', () => {
  it('renders initials from a full name', () => {
    render(<AvatarImage userName="John Doe" size="large" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('uses the first letter when only a single name is provided', () => {
    render(<AvatarImage userName="Cher" size="small" />);
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('falls back to an empty string when no name is provided', () => {
    render(<AvatarImage userName="   " size="large" />);
    const initials = document.querySelector<HTMLDivElement>('.initials');
    expect(initials).not.toBeNull();
    expect(initials?.textContent).toBe('');
  });
});
