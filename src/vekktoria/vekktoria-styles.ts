import { randomRGBAGenerator } from './utils';

// VekktoriaFill -> [r, g, b, alpha, visible]
type VekktoriaFill = [number, number, number, number, number] | [];
// VekktoriaStroke -> [r, g, b, alpha, visible, width]
type VekktoriaStroke = [number, number, number, number, number, number] | [];
// VekktoriaStyle -> [VekktoriaFill, VektoriaStroke, visble]
type VekktoriaStyle = [VekktoriaFill, VekktoriaStroke, 0|1];

const emptyStyle: VekktoriaStyle = [[],[], 0];

const defaultVekktoriaStyle: VekktoriaStyle = [
  [34, 22, 200, 1, 1],
  [100, 45, 233, 1, 0, 1],
  1
];

export const mapboxAttributes: Set<string> = new Set([
  'runway',
  'taxiway',
  'apron',
  'helipad',
  'landuse',
  'building',
  'national_park',
  'wetland',
  'wetland_noveg',
  'aboriginal_lands',
  'agriculture',
  'airport',
  'cemetery',
  'glacier',
  'grass',
  'hospital',
  'park',
  'piste',
  'pitch',
  'rock',
  'sand',
  'school',
  'scrub',
  'wood',
  'motorway',
  'motorway_link',
  'trunk',
  'trunk_link',
  'primary',
  'primary_link',
  'secondary',
  'secondary_link',
  'tertiary',
  'tertiary_link',
  'street',
  'street_limited',
  'pedestrian',
  'construction',
  'track',
  'service',
  'ferry',
  'path',
  'major_rail',
  'minor_rail',
  'service_rail',
  'aerialway',
  'golf',
  'roundabout',
  'mini_roundabout',
  'turning_circle',
  'turning_loop',
  'traffic_signals',
  'cliff',
  'fence',
  'gate',
  'hedge',
  'land',
  'water',
  'river',
  'canal',
  'stream',
  'drain',
  'ditch'
]);

export const generateEmptyVekktoriaStyles = (): Map<string, VekktoriaStyle> => {
  const newStyleMap = new Map().set('default', emptyStyle);

  mapboxAttributes.forEach((attribute) => {
    newStyleMap.set(attribute, emptyStyle);
  });

  return newStyleMap;
};

export const generateRandomVekktoriaStyles = (): Map<string, VekktoriaStyle> => {
  const newStyleMap = new Map().set('default', defaultVekktoriaStyle);

  mapboxAttributes.forEach((attribute) => {
    const newVekktoriaStyle: VekktoriaStyle = [
      [...randomRGBAGenerator(), 1],
      [...randomRGBAGenerator(), 1, 1],
      1
    ];

    newStyleMap.set(attribute, newVekktoriaStyle);
  });

  return newStyleMap;
};
