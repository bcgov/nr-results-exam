import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import RightPanelTitle from '../../components/RightPanelTitle';
import { IconButton } from '@carbon/react';
import { Close } from '@carbon/icons-react';

const renderComponent = (title: string, closeFn: Function) => {
  render(<RightPanelTitle title={title} closeFn={closeFn} />);
};

describe('RightPanelTitle', () => {
  it('should render the title and close button', () => {
    const closeFn = vi.fn();
    renderComponent('Title', closeFn);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should call the close function when the close button is clicked', () => {
    const closeFn = vi.fn();
    renderComponent('Title', closeFn);
    const button = screen.getByRole('button');
    button.click();
    expect(closeFn).toHaveBeenCalled();
  });

  it('should render the close button with icon', () => {
    const closeFn = vi.fn();
    renderComponent('Title', closeFn);
    const button = screen.getByRole('button');
    // expect the innerHTML to contain the an svg element
    expect(button.innerHTML).toContain('<svg');
  });
});
