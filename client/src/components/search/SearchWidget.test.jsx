import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchWidget from './SearchWidget';

jest.mock('../../stores/useSearchStore', () => {
  return jest.fn((selector) => {
    const state = {
      mode: 'short_term',
      longTermData: { duration: 1, isFlexible: false, flexibleMonths: [] },
      filters: { query: '' },
      setMode: jest.fn(),
      setLongTermData: jest.fn(),
      setFilters: jest.fn()
    };
    return selector(state);
  });
});

describe('SearchWidget', () => {
  it('renders Short-term mode by default', () => {
    render(<SearchWidget />);
    expect(screen.getByText('Short-term')).toBeInTheDocument();
    expect(screen.getByText('Long-term')).toBeInTheDocument();
  });
});
