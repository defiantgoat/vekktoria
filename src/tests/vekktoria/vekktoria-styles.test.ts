import {generateRandomVekktoriaStyles, mapboxAttributes} from '../../vekktoria/vekktoria-styles';

jest.mock('../../vekktoria/utils', () => ({
  randomRGBAGenerator: () => [0, 0, 0, 0]
}))

describe('vekktoria-style functions', () => {
  describe('generateRandomVekktoriaStyles', () => {
    it('returns a Map with all styles', () => {
      const randomStyles = generateRandomVekktoriaStyles();
      expect(randomStyles.has('default')).toEqual(true);
      mapboxAttributes.forEach((attribute) => {
        expect(randomStyles.has(attribute)).toEqual(true);
        expect(randomStyles.get(attribute)).toEqual([
          [0, 0, 0, 0, 1],
          [0, 0, 0, 0, 1, 1],
          1
        ]);
      });
    });
  })
})