import PBF from 'pbf'

interface RawFeature {
  id?: number;
  geometry?: number;
  layer: Map<string, any>;
  type: number;
  properties: Record<string, any>;
}

export const randomRGBAGenerator = (): [number, number, number, number] => {
  function randColor() {
    return Math.ceil(Math.random() * 255);
  }

  return [randColor(), randColor(), randColor(), 1];
}

/*
  getHeight = extent[3] - extent [1]
   this.dataProjection = new Projection({
      code: '',
      units: Units.TILE_PIXELS,
      extent: [0, 0, 4096, 4096] -> height = 4096
      worldExtent: [-10840605.099516837, 4275581.614159619, -10835713.129706586, 4280473.583969871] = height = 400075016
    });

    const features = format.readFeatures(array, {
      extent, [-10840605.099516837, 4275581.614159619, -10835713.129706586, 4280473.583969871]
      featureProjection: projection
    });

    scale = 1.2


*/

/**
 * Creates a composite transform given an initial translation, scale, rotation, and
 * final translation (in that order only, not commutative).
 * @param {!Transform} transform The transform (will be modified in place).
 * @param {number} dx1 Initial translation x.
 * @param {number} dy1 Initial translation y.
 * @param {number} sx Scale factor x.
 * @param {number} sy Scale factor y.
 * @param {number} angle Rotation (in counter-clockwise radians).
 * @param {number} dx2 Final translation x.
 * @param {number} dy2 Final translation y.
 * @return {!Transform} The composite transform.
 */
 export const compose = (transform, dx1, dy1, sx, sy, angle, dx2, dy2) => {
  const sin = Math.sin(angle);
  
  const cos = Math.cos(angle);
  transform[0] = sx * cos;
  transform[1] = sy * sin;
  transform[2] = -sx * sin;
  transform[3] = sy * cos;
  transform[4] = dx2 * sx * cos - dy2 * sx * sin + dx1;
  transform[5] = dx2 * sy * sin + dy2 * sy * cos + dy1;
  return transform;
}

const transform2D = (
  flatCoordinates,
  offset,
  end,
  stride,
  transform,
  opt_dest
) => {
  const dest = opt_dest ? opt_dest : [];
  let i = 0;
  for (let j = offset; j < end; j += stride) {
    const x = flatCoordinates[j];
    const y = flatCoordinates[j + 1];
    dest[i++] = transform[0] * x + transform[2] * y + transform[4];
    dest[i++] = transform[1] * x + transform[3] * y + transform[5];
  }
  if (opt_dest && dest.length != i) {
    dest.length = i;
  }
  return dest;
}

const transform = (feature, projection) => {
  const {
    geometryType,
    flatCoordinates,
    ends,
    values,
    id 
  } = feature;
  let tmpTransform = [1, 0, 0, 1, 0, 0];
  const pixelExtent = projection.extent; // [0, 0, 4096, 4096]
  const projectedExtent = [0, 0, 4096, 4096] 
  const scale = (projectedExtent[3]-projectedExtent[1]) / (pixelExtent[3]-pixelExtent[1]);

  console.log(scale)

  compose(tmpTransform, projectedExtent[0], projectedExtent[3], scale, -scale, 0, 0, 0);

  console.log(tmpTransform);

  const transformed = transform2D(flatCoordinates, 0, flatCoordinates.length, 2, tmpTransform, []);

  console.log(transformed)


}

// const transform = (projection) => {
//   projection = getProjection(projection);
//   const pixelExtent = projection.getExtent();
//   const projectedExtent = projection.getWorldExtent();
//   if (pixelExtent && projectedExtent) {
//     const scale = getHeight(projectedExtent) / getHeight(pixelExtent);
//     composeTransform(
//       tmpTransform,
//       projectedExtent[0],
//       projectedExtent[3],
//       scale,
//       -scale,
//       0,
//       0,
//       0
//     );
//     transform2D(
//       this.flatCoordinates_,
//       0,
//       this.flatCoordinates_.length,
//       2,
//       tmpTransform,
//       this.flatCoordinates_
//     );
//   }
// }

const linearRingIsClockwise = (
    flatCoordinates: Array<number>,
    offset: number,
    end: number,
    stride: number
  ): boolean|undefined => {
  // https://stackoverflow.com/q/1165647/clockwise-method#1165943
  // https://github.com/OSGeo/gdal/blob/master/gdal/ogr/ogrlinearring.cpp
  let edge = 0;
  let x1 = flatCoordinates[end - stride];
  let y1 = flatCoordinates[end - stride + 1];
  for (; offset < end; offset += stride) {
    const x2 = flatCoordinates[offset];
    const y2 = flatCoordinates[offset + 1];
    edge += (x2 - x1) * (y2 + y1);
    x1 = x2;
    y1 = y2;
  }
  return edge === 0 ? undefined : edge > 0;
}

const getGeometryType = (type: number, numEnds: number): string => {
  let geometryType;
  if (type === 1) {
    geometryType =
      numEnds === 1 ? 'GeometryType.POINT' : 'GeometryType.MULTI_POINT';
  } 
  else if (type === 2) {
    geometryType =
      numEnds === 1 ? 'GeometryType.LINE_STRING' : 'GeometryType.MULTI_LINE_STRING';
  } 
  else if (type === 3) {
    geometryType = 'GeometryType.POLYGON';
    // MultiPolygon not relevant for rendering - winding order determines
    // outer rings of polygons.
  }
  return geometryType;
}

const readRawGeometry = (pbf: any, feature: RawFeature, flatCoordinates: Array<number>, ends: Array<number>): void => {
  pbf.pos = feature.geometry;

  const end = pbf.readVarint() + pbf.pos;
  let cmd = 1;
  let length = 0;
  let x = 0;
  let y = 0;
  let coordsLen = 0;
  let currentEnd = 0;

  while (pbf.pos < end) {
    if (!length) {
      const cmdLen = pbf.readVarint();
      cmd = cmdLen & 0x7;
      length = cmdLen >> 3;
    }

    length--;

    if (cmd === 1 || cmd === 2) {
      x += pbf.readSVarint();
      y += pbf.readSVarint();

      if (cmd === 1) {
        // moveTo
        if (coordsLen > currentEnd) {
          ends.push(coordsLen);
          currentEnd = coordsLen;
        }
      }

      flatCoordinates.push(x, y);
      coordsLen += 2;
    } else if (cmd === 7) {
      if (coordsLen > currentEnd) {
        // close polygon
        flatCoordinates.push(
          flatCoordinates[currentEnd],
          flatCoordinates[currentEnd + 1]
        );
        coordsLen += 2;
      }
    } else {
      console.error('invalid command found in PBF');
      //assert(false, 59); // Invalid command found in the PBF
    }
  }

  if (coordsLen > currentEnd) {
    ends.push(coordsLen);
    currentEnd = coordsLen;
  }
}

function createFeature(pbf, rawFeature, options) {
  const {type, properties: values} = rawFeature;
  let {id} = rawFeature;
  
  if (type && type === 0) {
    return null;
  }

  console.log('rawFeature.properties: ', values)


  values['layer'] = rawFeature.layer.get('name');

  console.log(values)

  const flatCoordinates = [];
  const ends = [];
  
  readRawGeometry(pbf, rawFeature, flatCoordinates, ends);

  console.log(flatCoordinates)

  const geometryType = getGeometryType(type, ends.length);

  console.log(options)

  const feature = {
    geometryType,
    flatCoordinates,
    ends,
    values,
    id
  };

  transform(feature, options.dataProjection)


    //feature.transform(options.dataProjection);
  

  // if (geometryType == 'GeometryType.POLYGON') {
  //     const endss = [];
  //     let offset = 0;
  //     let prevEndIndex = 0;
  //     for (let i = 0, ii = ends.length; i < ii; ++i) {
  //       const end = ends[i];
  //       // classifies an array of rings into polygons with outer rings and holes
  //       if (!linearRingIsClockwise(flatCoordinates, offset, end, 2)) {
  //         // @ts-ignore
  //         endss.push(ends.slice(prevEndIndex, i + 1));
  //       } else {
  //         if (endss.length === 0) {
  //           continue;
  //         }
  //         // @ts-ignore
  //         endss[endss.length - 1].push(ends[prevEndIndex]);
  //       }
  //       prevEndIndex = i + 1;
  //       offset = end;
  //     }
  //     if (endss.length > 1) {
  //       console.log(endss)
  //       // geom = new MultiPolygon(flatCoordinates, GeometryLayout.XY, endss);
  //     } else {
  //       console.log(endss)
  //       // geom = new Polygon(flatCoordinates, GeometryLayout.XY, ends);
  //     }
  // }

  // if (geometryType == 'GeometryType.POLYGON') {
  //   const endss = [];
  //   let offset = 0;
  //   let prevEndIndex = 0;
  //   for (let i = 0, ii = ends.length; i < ii; ++i) {
  //   const end = ends[i];
  //   // classifies an array of rings into polygons with outer rings and holes
  //   if (!linearRingIsClockwise(flatCoordinates, offset, end, 2)) {
  //     // @ts-ignore
  //     endss.push(ends.slice(prevEndIndex, i + 1));
  //   } else {
  //     if (endss.length === 0) {
  //       continue;
  //     }
  //     endss[endss.length - 1].push(ends[prevEndIndex]);
  //   }
  //   prevEndIndex = i + 1;
  //   offset = end;
  //   console.log(endss)
  //   if (endss.length > 1) {
  //     console.log(endss)
  //     //geom = new MultiPolygon(flatCoordinates, GeometryLayout.XY, endss);
  //   } else {
  //     //geom = new Polygon(flatCoordinates, GeometryLayout.XY, ends);
  //   }
  // }

  // if (this.featureClass_ === RenderFeature) {
  //   feature = new this.featureClass_(
  //     geometryType,
  //     flatCoordinates,
  //     ends,
  //     values,
  //     id
  //   );
  //   feature.transform(options.dataProjection);
  // } else {
  //   let geom;
  //   if (geometryType == GeometryType.POLYGON) {
  //     const endss = [];
  //     let offset = 0;
  //     let prevEndIndex = 0;
  //     for (let i = 0, ii = ends.length; i < ii; ++i) {
  //       const end = ends[i];
  //       // classifies an array of rings into polygons with outer rings and holes
  //       if (!linearRingIsClockwise(flatCoordinates, offset, end, 2)) {
  //         endss.push(ends.slice(prevEndIndex, i + 1));
  //       } else {
  //         if (endss.length === 0) {
  //           continue;
  //         }
  //         endss[endss.length - 1].push(ends[prevEndIndex]);
  //       }
  //       prevEndIndex = i + 1;
  //       offset = end;
  //     }
  //     if (endss.length > 1) {
  //       geom = new MultiPolygon(flatCoordinates, GeometryLayout.XY, endss);
  //     } else {
  //       geom = new Polygon(flatCoordinates, GeometryLayout.XY, ends);
  //     }
  //   } else {
  //     geom =
  //       geometryType === GeometryType.POINT
  //         ? new Point(flatCoordinates, GeometryLayout.XY)
  //         : geometryType === GeometryType.LINE_STRING
  //         ? new LineString(flatCoordinates, GeometryLayout.XY)
  //         : geometryType === GeometryType.POLYGON
  //         ? new Polygon(flatCoordinates, GeometryLayout.XY, ends)
  //         : geometryType === GeometryType.MULTI_POINT
  //         ? new MultiPoint(flatCoordinates, GeometryLayout.XY)
  //         : geometryType === GeometryType.MULTI_LINE_STRING
  //         ? new MultiLineString(flatCoordinates, GeometryLayout.XY, ends)
  //         : null;
  //   }
  //   const ctor = /** @type {typeof import("../Feature.js").default} */ (this
  //     .featureClass_);
  //   feature = new ctor();
  //   if (this.geometryName_) {
  //     feature.setGeometryName(this.geometryName_);
  //   }
  //   const geometry = transformGeometryWithOptions(geom, false, options);
  //   feature.setGeometry(geometry);
  //   feature.setId(id);
  //   feature.setProperties(values, true);
  // }

  return feature;
}

// Mutates the layer object passed
const readIndividualLayer = (tag: number, layer: Map<string,any>, pbf: any): void => {
  if (tag === 15) {
    layer.set('version', pbf.readVarint());
  } 
  else if (tag === 1) {
    layer.set('name', pbf.readString());
  } 
  else if (tag === 5) {
    layer.set('extent', pbf.readVarint());
  } 
  else if (tag === 2) {
    layer.get('features').push(pbf.pos);
  } 
  else if (tag === 3) {
    layer.get('keys').push(pbf.readString());
  } 
  else if (tag === 4) {
    let value = null;
    const end = pbf.readVarint() + pbf.pos;
    while (pbf.pos < end) {
      tag = pbf.readVarint() >> 3;
      value =
        tag === 1
          ? pbf.readString()
          : tag === 2
          ? pbf.readFloat()
          : tag === 3
          ? pbf.readDouble()
          : tag === 4
          ? pbf.readVarint64()
          : tag === 5
          ? pbf.readVarint()
          : tag === 6
          ? pbf.readSVarint()
          : tag === 7
          ? pbf.readBoolean()
          : null;
    }
    layer.get('values').push(value);
  }
};

const readLayers = (tag: number, layers: Map<string,any>, pbf: any): void => {
  const individualLayer = new Map();
  individualLayer.set('keys', []);
  individualLayer.set('values', []);
  individualLayer.set('features', []);

  if (tag === 3) {
    const end = pbf.readVarint() + pbf.pos;
        
    pbf.readFields(readIndividualLayer, individualLayer, end);

    const featureLength = individualLayer.get('features').length;

    if (featureLength > 0) {
      individualLayer.set('length', featureLength);
      layers.set(individualLayer.get('name'), individualLayer);
    }
  }
};


const featurePBFReader = (tag: number, feature: RawFeature, pbf: any): void => {
  if (tag == 1) {
    feature.id = pbf.readVarint();
  } 
  else if (tag == 2) {
    const end = pbf.readVarint() + pbf.pos;
    while (pbf.pos < end) {
      const key = feature.layer.get('keys')[pbf.readVarint()];
      const value = feature.layer.get('values')[pbf.readVarint()];
      feature.properties[key] = value;
    }
  } 
  else if (tag == 3) {
    feature.type = pbf.readVarint();
  } 
  else if (tag == 4) {
    feature.geometry = pbf.pos;
  }
};

const readRawFeature = (pbf: any, layer: Map<string, any>, i: number): RawFeature => {
  pbf.pos = layer.get('features')[i];
  const end = pbf.readVarint() + pbf.pos;

  const feature: RawFeature = {
    layer: layer,
    type: 0,
    properties: {},
  };

  pbf.readFields(featurePBFReader, feature, end);

  return feature;
};
/*
  getHeight = extent[3] - extent [1]
   this.dataProjection = new Projection({
      code: '',
      units: Units.TILE_PIXELS,
      extent: [0, 0, 4096, 4096] -> height = 4096
      worldExtent: [-10840605.099516837, 4275581.614159619, -10835713.129706586, 4280473.583969871] = height = 400075016
    });

    const features = format.readFeatures(array, {
      extent, [-10840605.099516837, 4275581.614159619, -10835713.129706586, 4280473.583969871]
      featureProjection: projection
    });

    scale = 1.2


*/


export const mvtReader = async (): Promise<void> => {
  const layersMap = new Map();

  const dataProjection: Record<string,any> = {
    code: '',
    units: 'tile-pixels',
    extent: null
  }

  const url = 'https://d.tiles.mapbox.com/v4/mapbox.mapbox-streets-v8/17/29374/52067.mvt?access_token=pk.eyJ1IjoiZGVmaWFudGdvYXQiLCJhIjoiY2p0aHcwdm9qMGVuMzRhcW1rb2ljNjIyaCJ9.TzlHHerKIgD_e0nnbvDFBA';

  const data = await fetch(url);
  const array = await data.arrayBuffer();

  const pbf = new PBF(array);
  const pbfLayers: Map<string,any> = pbf.readFields(readLayers, layersMap);

  pbfLayers.forEach((layer: Map<string,any>, layerName: string) => {
    const rawFeatures: Array<any> = [];
    const formattedFeatures: Array<any> = [];
    const extent = layer.has('extent') ? [0, 0, layer.get('extent'), layer.get('extent')] : null;
  
    const layerLength = layer.get('length');

    dataProjection.extent = extent;
    
    for (let i = 0; i < layerLength; i++) {
      const rawFeature = readRawFeature(pbf, layer, i);
      rawFeatures.push(rawFeature);

      const newFeature = createFeature(pbf, rawFeature, {dataProjection});
      formattedFeatures.push(newFeature);
    }

    layer.set('rawFeatures', rawFeatures);
    layer.set('formattedFeatures', formattedFeatures);
  });

  console.log(pbfLayers)
};

// PBF Layers example
/*
{
	"poi_label": {
		"keys": ["type", "name_script", "sizerank", "iso_3166_1", "maki", "class", "name", "category_zh-Hans", "filterrank", "category_en", "iso_3166_2"],
		"values": ["Place Of Worship", "Latin", 16, "US", "religious-christian", "religion", "First Christian Church", "基督教堂", 1, "Church", "US-OK"],
		"features": [20],
		"version": 2,
		"name": "poi_label",
		"extent": 4096,
		"length": 1
	},
	"landuse": {
		"keys": ["type", "class", "sizerank"],
		"values": ["parking", 14],
		"features": [332],
		"version": 2,
		"name": "landuse",
		"extent": 4096,
		"length": 1
	},
	"housenum_label": {
		"keys": ["iso_3166_1", "house_num", "iso_3166_2"],
		"values": ["US", "2301", "US-OK"],
		"features": [435],
		"version": 2,
		"name": "housenum_label",
		"extent": 4096,
		"length": 1
	},
	"road": {
		"keys": ["type", "structure", "oneway", "class", "len", "iso_3166_2", "iso_3166_1"],
		"values": ["service", "none", "false", 100, "US-OK", "US", "residential", "street", 1740],
		"features": [526, 574],
		"version": 2,
		"name": "road",
		"extent": 4096,
		"length": 2
	},
	"building": {
		"keys": ["extrude", "iso_3166_1", "underground", "height", "iso_3166_2", "type", "min_height"],
		"values": ["true", "US", "false", 3, "US-OK", "building", 0],
		"features": [892, 940, 997, 1044, 1090, 1159, 1206, 1254, 1305],
		"version": 2,
		"name": "building",
		"extent": 4096,
		"length": 9
	}
}
*/

/*

  // Iterate through all layers
  // for (const layerName in pbfLayers) {
  //   const {extent: lyrExtent, length: lyrLength} = pbfLayers[layerName];

  //   const pbfLayer = pbfLayers[layerName];
  //   const extent = lyrExtent ? [0, 0, lyrExtent, lyrExtent] : null;
  //   dataProjection.extent = extent;


  //   for (let i = 0; i < lyrLength; i++) {
  //     console.log(i)
  //     const rawFeature = readRawFeature(pbf, pbfLayer, i);
  //     console.log(rawFeature)
  //   }

  // }
 
  // const features = [];
  // for (const name in pbfLayers) {
  //   // if (layers && layers.indexOf(name) == -1) {
  //   //   continue;
  //   // }
  //   const pbfLayer = pbfLayers[name];

  //   const extent = pbfLayer ? [0, 0, pbfLayer.extent, pbfLayer.extent] : null;
  //   console.log(extent)
  //   // dataProjection.setExtent(extent);

  //   for (let i = 0, ii = pbfLayer.length; i < ii; ++i) {
  //     const rawFeature = readRawFeature(pbf, pbfLayer, i);
  //     console.log(rawFeature)
  //     createFeature(pbf, rawFeature, null)
  //     // features.push(this.createFeature(pbf, rawFeature, options));
  //   }
  // }

  */



