import React from 'react';
import EmailNotification from '../../components/EmailNotifications';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

const renderComponent = (status: 'success' | 'error' | null) => {
  render(<EmailNotification emailStatus={status} />);
};

describe('EmailNotification', () => {
  it('should show "Email report sent successfully." when the email status is success', () => {
    renderComponent('success');
    // use regex to match the text
    expect(screen.getByText(/Email report sent successfully./)).toBeInTheDocument();
  });
  it('should show "Failed to send the email report." when the email status is error', () => {
    renderComponent('error');
    expect(screen.getByText(/Failed to send the email report./)).toBeInTheDocument();
  });
  it('should not show any message when the email status is null', () => {
    renderComponent(null);
    expect(screen.queryByText(/Email report sent successfully./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Failed to send the email report./)).not.toBeInTheDocument();
  });
});
