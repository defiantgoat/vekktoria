// VekktoriaFill -> [r, g, b, alpha, visible]
type VekktoriaFill = [number, number, number, number, 1|0] | [];
// VekktoriaStroke -> [r, g, b, alpha, visible, width]
type VekktoriaStroke = [number, number, number, number, 1|0, number] | [];
// VekktoriaStyle -> [VekktoriaFill, VektoriaStroke, visble]
type VekktoriaStyle = [VekktoriaFill, VekktoriaStroke, 1|0];

const emptyStyle: VekktoriaStyle = [[],[], 0];

const defaultVekktoriaStyle: VekktoriaStyle = [
  [34, 22, 200, 1, 1],
  [100, 45, 233, 1, 0, 1],
  1
];

export const vekktoriaStyleTemplate: Map<string, VekktoriaStyle> = new Map([
  ['runway', emptyStyle],
  ['taxiway', defaultVekktoriaStyle],
  ['apron', emptyStyle],
  ['helipad', emptyStyle],
  ['landuse', emptyStyle],
  ['building', emptyStyle],
  ['national_park', emptyStyle],
  ['wetland', emptyStyle],
  ['wetland_noveg', emptyStyle],
  ['aboriginal_lands', emptyStyle],
  ['agriculture', emptyStyle],
  ['airport', emptyStyle],
  ['cemetery', emptyStyle],
  ['glacier', emptyStyle],
  ['grass', emptyStyle],
  ['hospital', emptyStyle],
  ['park', emptyStyle],
  ['piste', emptyStyle],
  ['pitch', emptyStyle],
  ['rock', emptyStyle],
  ['sand', emptyStyle],
  ['school', emptyStyle],
  ['scrub', emptyStyle],
  ['wood', emptyStyle],
  ['motorway', emptyStyle],
  ['motorway_link', emptyStyle],
  ['trunk', emptyStyle],
  ['trunk_link', emptyStyle],
  ['primary', emptyStyle],
  ['primary_link', emptyStyle],
  ['secondary', emptyStyle],
  ['secondary_link', emptyStyle],
  ['tertiary', emptyStyle],
  ['tertiary_link', emptyStyle],
  ['street', emptyStyle],
  ['street_limited', emptyStyle],
  ['pedestrian', emptyStyle],
  ['construction', emptyStyle],
  ['track', emptyStyle],
  ['service', emptyStyle],
  ['ferry', emptyStyle],
  ['path', emptyStyle],
  ['major_rail', emptyStyle],
  ['minor_rail', emptyStyle],
  ['service_rail', emptyStyle],
  ['aerialway', emptyStyle],
  ['golf', emptyStyle],
  ['roundabout', emptyStyle],
  ['mini_roundabout', emptyStyle],
  ['turning_circle', emptyStyle],
  ['turning_loop', emptyStyle],
  ['traffic_signals', emptyStyle],
  ['cliff', emptyStyle],
  ['fence', emptyStyle],
  ['gate', emptyStyle],
  ['hedge', emptyStyle],
  ['land', emptyStyle],
  ['water', emptyStyle],
  ['river', emptyStyle],
  ['canal', emptyStyle],
  ['stream', emptyStyle],
  ['drain', emptyStyle],
  ['ditch', emptyStyle]
]);

export const generateRandomVekktoriaStyles = (): Map<string, VekktoriaStyle> => {
  
}
