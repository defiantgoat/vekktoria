import React from 'react';
import { render } from '@testing-library/react';
import MapContainer from '../components/MapContainer';

const MockChildElement = () => <div>mock-child</div>

describe('MapContainer', () => {
  it('renders as expected', async () => {
    const { container } = render(
      <MapContainer />
    );
   
    expect(container).not.toBeUndefined();
  });

  it('renders with a child element', async () => {
    const { container, getByText } = render(
      <MapContainer>
        <MockChildElement />
      </MapContainer>
    );
   
    expect(container).not.toBeUndefined();
    expect(getByText('mock-child')).not.toBeUndefined();
  });
});
