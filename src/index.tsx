import React from 'react';
import { render } from 'react-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import App from './components/App';


render(
  <>
    <CssBaseline />
    <App />
  </>
 ,
  document.getElementById('root')
);

// Needed for Hot Module Replacement
// @ts-ignore
if (typeof(module.hot) !== 'undefined') {
  // @ts-ignore
  module.hot.accept(); // eslint-disable-line no-undef  
}