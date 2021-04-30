import React from 'react';
import useStyles from './use-styles';
import MapContainer from '../MapContainer';
import MapboxLayer from '../MapboxLayer';
 
const App: React.FC = () =>  {

  const {app} = useStyles();

  return (
    <div className={app}>
      <MapContainer>
        <MapboxLayer />
      </MapContainer>
    </div>
  );
};

export default App;
