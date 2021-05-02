import PBF from 'pbf'

export const randomRGBAGenerator = (): [number, number, number, number] => {
  function randColor() {
    return Math.ceil(Math.random() * 255);
  }

  return [randColor(), randColor(), randColor(), 1];
}

function linearRingIsClockwise(flatCoordinates, offset, end, stride) {
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

function getGeometryType(type, numEnds) {
  /** @type {import("../geom/GeometryType.js").default} */
  let geometryType;
  if (type === 1) {
    geometryType =
      numEnds === 1 ? 'GeometryType.POINT' : 'GeometryType.MULTI_POINT';
  } else if (type === 2) {
    geometryType =
      numEnds === 1 ? 'GeometryType.LINE_STRING' : 'GeometryType.MULTI_LINE_STRING';
  } else if (type === 3) {
    geometryType = 'GeometryType.POLYGON';
    // MultiPolygon not relevant for rendering - winding order determines
    // outer rings of polygons.
  }
  return geometryType;
}

function readRawGeometry_(pbf, feature, flatCoordinates, ends) {
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
      //assert(false, 59); // Invalid command found in the PBF
    }
  }

  if (coordsLen > currentEnd) {
    ends.push(coordsLen);
    currentEnd = coordsLen;
  }
}

function createFeature_(pbf, rawFeature, options) {
  const type = rawFeature.type;
  if (type === 0) {
    return null;
  }

  let feature;
  const values = rawFeature.properties;

  console.log('rawFeature.properties: ', rawFeature.properties)

  let id = rawFeature.id;
  // if (!this.idProperty_) {
  //   id = rawFeature.id;
  // } else {
  //   id = values[this.idProperty_];
  //   delete values[this.idProperty_];
  // }

  values['layer'] = rawFeature.layer.name;

  console.log(values)

  const flatCoordinates = [];
  const ends = [];
  
  readRawGeometry_(pbf, rawFeature, flatCoordinates, ends);

  console.log(flatCoordinates)

  const geometryType = getGeometryType(type, ends.length);

  console.log(geometryType)

  if (geometryType == 'GeometryType.POLYGON') {
      const endss = [];
      let offset = 0;
      let prevEndIndex = 0;
      for (let i = 0, ii = ends.length; i < ii; ++i) {
        const end = ends[i];
        // classifies an array of rings into polygons with outer rings and holes
        if (!linearRingIsClockwise(flatCoordinates, offset, end, 2)) {
          // @ts-ignore
          endss.push(ends.slice(prevEndIndex, i + 1));
        } else {
          if (endss.length === 0) {
            continue;
          }
          // @ts-ignore
          endss[endss.length - 1].push(ends[prevEndIndex]);
        }
        prevEndIndex = i + 1;
        offset = end;
      }
      if (endss.length > 1) {
        console.log(endss)
        // geom = new MultiPolygon(flatCoordinates, GeometryLayout.XY, endss);
      } else {
        console.log(endss)
        // geom = new Polygon(flatCoordinates, GeometryLayout.XY, ends);
      }
  }

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

function readIndividualLayer(tag, layer, pbf) {
  if (tag === 15) {
    layer.version = pbf.readVarint();
  } else if (tag === 1) {
    layer.name = pbf.readString();
  } else if (tag === 5) {
    layer.extent = pbf.readVarint();
  } else if (tag === 2) {
    layer.features.push(pbf.pos);
  } else if (tag === 3) {
    layer.keys.push(pbf.readString());
  } else if (tag === 4) {
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
    layer.values.push(value);
  }
}

function readLayers(tag, layers, pbf) {
  //console.log(tag, layers, pbf);
  if (tag === 3) {
    const layer = {
      keys: [],
      values: [],
      features: [],
    };
    const end = pbf.readVarint() + pbf.pos;
    console.log(end)
    pbf.readFields(readIndividualLayer, layer, end);
    console.log(layer)
    // @ts-ignore
    layer.length = layer.features.length;
    // @ts-ignore
    if (layer.length) {
      // @ts-ignore
      layers[layer.name] = layer;
    }
  }
}

function featurePBFReader(tag, feature, pbf) {
  if (tag == 1) {
    feature.id = pbf.readVarint();
  } else if (tag == 2) {
    const end = pbf.readVarint() + pbf.pos;
    while (pbf.pos < end) {
      const key = feature.layer.keys[pbf.readVarint()];
      const value = feature.layer.values[pbf.readVarint()];
      feature.properties[key] = value;
    }
  } else if (tag == 3) {
    feature.type = pbf.readVarint();
  } else if (tag == 4) {
    feature.geometry = pbf.pos;
  }
}

function readRawFeature(pbf, layer, i) {
  pbf.pos = layer.features[i];
  console.log('pbf.pos', pbf.pos)
  const end = pbf.readVarint() + pbf.pos;
  console.log('end', end)

  const feature = {
    layer: layer,
    type: 0,
    properties: {},
  };

  pbf.readFields(featurePBFReader, feature, end);

  return feature;
}



export const mvtReader = async (): Promise<void> => {
  const layers = new Map();

  const dataProjection: Record<string,any> = {
    code: '',
    units: 'tile-pixels',
    extent: null
  }

  const url = 'https://d.tiles.mapbox.com/v4/mapbox.mapbox-streets-v8/17/29374/52067.mvt?access_token=pk.eyJ1IjoiZGVmaWFudGdvYXQiLCJhIjoiY2p0aHcwdm9qMGVuMzRhcW1rb2ljNjIyaCJ9.TzlHHerKIgD_e0nnbvDFBA';

  const data = await fetch(url);
  const array = await data.arrayBuffer();

  const pbf = new PBF(array);
  const pbfLayers = pbf.readFields(readLayers, {});
  // const pbfLayers = pbf.readFields(function (tag, layers) {
  //   console.log(tag, pbf.pos)
  //   if (tag == 3) {
  //     const layer = {
  //       keys: [],
  //       values: [],
  //       features: [],
  //     };

  //     const end = pbf.readVarint() + pbf.pos;
  //     pbf.readFields(function (tag, layer, end) {
  //       console.log(tag, layer)
  //     });
  //     //pbf.readFields(readIndividualLayer, layer, end);
  //   }
    
  // }, {cat: 'dog'});

  console.log(pbfLayers)

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
  //     createFeature_(pbf, rawFeature, null)
  //     // features.push(this.createFeature_(pbf, rawFeature, options));
  //   }
  // }

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





