import React from 'react';
import useStyles from './use-styles';
import MapContainer from '../MapContainer';
 
const App: React.FC = () =>  {

  const {app} = useStyles();

  return (
    <div className={app}>
      <MapContainer />
    </div>
  );
};

export default App;
