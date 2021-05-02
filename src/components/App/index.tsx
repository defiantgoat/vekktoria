import React from 'react';
import useStyles from './use-styles';
import MapContainer from '../MapContainer';
import MapboxLayer from '../MapboxLayer';
import MVTReader from '../MVTReader';
 
const App: React.FC = () =>  {

  const {app} = useStyles();

  return (
    <div className={app}>
      <MVTReader />
      <MapContainer>
        <MapboxLayer />
      </MapContainer>
    </div>
  );
};

export default App;
