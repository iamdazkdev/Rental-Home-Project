import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotFoundPage from './NotFoundPage';

jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}), { virtual: true });

describe('NotFoundPage', () => {
  it('renders 404 text and link to home', () => {
    render(<NotFoundPage />);
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Không tìm thấy trang')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /về trang chủ/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});
