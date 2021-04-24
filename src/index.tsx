import React from 'react';
import { render } from 'react-dom';


render(
  <div>
    vekktoriaaa
  </div>,
  document.getElementById('root')
);

// Needed for Hot Module Replacement
// @ts-ignore
if (typeof(module.hot) !== 'undefined') {
  // @ts-ignore
  module.hot.accept(); // eslint-disable-line no-undef  
}