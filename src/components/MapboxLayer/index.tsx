import React, {useContext, useEffect, useRef, useState} from 'react';
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

const MapboxLayer: React.FC = () =>  {
  const map = useContext(MapContainerContext);
  const layer = useRef(null as OLVectorTileLayer | null);
  const source = useRef(null as OLVectorTile | null);
  const format = new MVT();

  const toSVG = () => {
    const extent = map?.getView().getProjection().getExtent();
    if (extent) {
      const features = source.current?.getFeaturesInExtent(map.getView().getProjection().getExtent());
      // take extent and convert to screen coordinates
      // take each feature and convert its flat coords to screen coords
      // iterate through and create an svg, using styles as set in state.
      console.log(features)
    }
  };

  const mapboxTileLoadFunction = (tile, src)=> {
    tile.setLoader(async (extent, resolution, projection) => {
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

  return (
    <button
      style={{position: 'absolute', top: 0, right: 0}}
      onClick={toSVG}
    >
      tosvg
    </button>
  );
};

export default MapboxLayer;
