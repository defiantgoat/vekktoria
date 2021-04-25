import React from 'react';
import { render } from '@testing-library/react';
import App from '../components/App';

jest.mock('../components/MapContainer', () => ({
  __esModule: true,
  default: () => <div>mapcontainer</div>
}))

describe('App', () => {
  it('renders as expected', async () => {
    const { container, getByText } = render(<App />);
   
    expect(container).not.toBeUndefined();
    expect(getByText('mapcontainer')).not.toBeUndefined();
  });
});
