import React, {useLayoutEffect, useState} from 'react';
import OLMap from 'ol/Map';
import OLView from 'ol/View';
import OLTileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import useStyles from './use-styles';
import MapContainerContext from '../MapContainerContext';
import 'ol/ol.css';

const MapContainer: React.FC = () =>  {
  
  const {mapContainer} = useStyles();

  const [olMap, setOlMap] = useState(null as OLMap | null);

  useLayoutEffect(() => {
    const map = new OLMap({
      view: new OLView({
        center: [0, 0],
        zoom: 1
      }),
      layers: [
        new OLTileLayer({
          source: new OSM()
        })
      ],
      target: 'map'
    });

    setOlMap(map);

    return () => {
      setOlMap(null);
    }
  }, []);

  return (
    <MapContainerContext.Provider value={olMap}>
      <div id='map' className={mapContainer}>
      </div>
    </MapContainerContext.Provider>
  );
};

export default MapContainer;