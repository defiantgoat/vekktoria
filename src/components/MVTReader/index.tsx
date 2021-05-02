import React, {useEffect} from 'react';
import {mvtReader} from '../../vekktoria/utils';
 
const MVTReader: React.FC = () =>  {
  useEffect(() => {
    mvtReader();
  })
  return null;
};

export default MVTReader;