import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BCHeader from '../../components/BCHeader';
import '@testing-library/jest-dom';

describe('BC Header component tests', () => {
  const renderComponent = () => render(
    <MemoryRouter>
      <BCHeader />
    </MemoryRouter>
  );

  it('renders the header with correct structure', () => {
    renderComponent();

    const header = screen.getByTestId('header');
    expect(header).toHaveClass('bc-gov-header');
  });

  it('renders the BC Government logo', () => {
    renderComponent();

    const logo = screen.getByAltText('BCGov Logo');
    expect(logo).toBeInTheDocument();
  });

  it('renders BRITISH COLUMBIA text', () => {
    renderComponent();

    expect(screen.getByText('BRITISH')).toBeInTheDocument();
    expect(screen.getByText('COLUMBIA')).toBeInTheDocument();
  });

  it('renders RESULTS EXAM title', () => {
    renderComponent();

    const titleLink = screen.getByTestId('header-name');
    expect(titleLink).toHaveTextContent('RESULTS EXAM');
    expect(titleLink).toHaveAttribute('href', '/');
  });

  it('renders the separator', () => {
    const { container } = renderComponent();

    const separator = container.querySelector('.bc-gov-header__separator');
    expect(separator).toBeInTheDocument();
  });
});
