import React from 'react';
import { render } from '@testing-library/react';
import App from '../components/App';

describe('App', () => {
  it('renders as expected', async () => {
    const { container } = render(<App />);

    expect(container).not.toBeUndefined();
  });
});
