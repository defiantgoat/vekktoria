import React, {useContext, useEffect, useRef} from 'react';
import OLVectorTileLayer from 'ol/layer/VectorTile';
import OLVectorTile from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT.js';
import {createXYZ, extentFromProjection} from 'ol/tilegrid';
import {MAPBOX_TOKEN} from '../../keys';
import MapContainerContext from '../MapContainerContext';

const mapboxTileUrlFunction = ([z,x,y])=> {
  const domain = 'abcd'.substr(
    ((x << z) + y) % 4, 1);

  const url = `https://${domain}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v8/${z}/${x}/${y}.mvt?access_token=${MAPBOX_TOKEN}`;
  
  return url;
};

const mapboxTileLoadFunction = (tile, src)=> {
  tile.setLoader(async (extent, resolution, projection) => {
    console.log(projection, extent);
    const data = await fetch(src);
    const array = await data.arrayBuffer();
    const format = tile.getFormat();
    const features = format.readFeatures(array, {
      extent,
      featureProjection: projection
    });

    tile.setFeatures(features)
  });
};

const MapboxLayer: React.FC = () =>  {
  const map = useContext(MapContainerContext);
  const layer = useRef(null as OLVectorTileLayer | null);
  const source = useRef(null as OLVectorTile | null);
  const format = new MVT();

  useEffect(() => {
    if (map) {
      const tileSize = [256, 256];
      const projection = map.getView().getProjection();
      const tileGrid = createXYZ({
        extent: extentFromProjection(projection),
        tileSize
      });

      source.current = new OLVectorTile({
        projection,
        format,
        tileSize,
        tileGrid,
        tileUrlFunction: mapboxTileUrlFunction,
        tileLoadFunction: mapboxTileLoadFunction
      });

      layer.current = new OLVectorTileLayer({
        source: source.current
      });
  
      map.addLayer(layer.current);
    }
    
    return () => {
      if (map) {
        map.removeLayer(layer.current);
        layer.current = null;
      }
    }
  }, [map, layer, source]);

  return null;
};

export default MapboxLayer;
