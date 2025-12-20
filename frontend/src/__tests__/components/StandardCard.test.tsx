import React from 'react';
import StandardCard from '../../components/StandardCard';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

const renderComponent = () => {
  render(
    <BrowserRouter>
      <StandardCard
        header="Test A: Declaration and Update"
        description=" This test is for individuals entering data for timber licenses, whether creating new openings or updating existing ones."
        url="/testA"
        image="ChartCustom"
      />
    </BrowserRouter>,
  );
};

describe('StandardCard', () => {
  it('should render the component with correct title and description', () => {
    renderComponent();
    expect(screen.getByText('Test A: Declaration and Update')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This test is for individuals entering data for timber licenses, whether creating new openings or updating existing ones.',
      ),
    ).toBeInTheDocument();
  });
  it('should render the component with correct image', () => {
    renderComponent();
    expect(screen.getByTestId('std-card-pictogram')).toBeInTheDocument();
  });
});
