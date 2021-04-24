import React from 'react';
import useStyles from './use-styles';

const App: React.FC = () =>  {

  const {app} = useStyles();

  return (
    <div className={app}>
    </div>
  );
};

export default App;
