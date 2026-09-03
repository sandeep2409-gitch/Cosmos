import { PLANETS_DATA, SUN_CONFIG } from '../../js/config/planetsData.js';
import { SATELLITES_DATA } from '../../js/config/satellitesData.js';
import { ARTIFICIAL_SATELLITES_DATA } from '../../js/config/artificialSatellitesData.js';

/**
 * Service Layer for COSMOS Celestial Objects Data
 */
export class ObjectService {
  static getAllObjects(typeFilter = null) {
    const all = [
      SUN_CONFIG,
      ...PLANETS_DATA,
      ...SATELLITES_DATA,
      ...ARTIFICIAL_SATELLITES_DATA
    ];

    if (!typeFilter) return all;

    const filterMap = {
      'planet': ['planet', 'star'],
      'natural-satellite': ['satellite', 'Natural Satellite', 'Galilean Satellite'],
      'artificial-satellite': ['artificial'],
      'spacecraft': ['artificial']
    };

    const allowedTypes = filterMap[typeFilter.toLowerCase()];
    if (!allowedTypes) return all;

    return all.filter(o => allowedTypes.includes(o.type) || allowedTypes.includes(o.category));
  }

  static getObjectById(id) {
    const all = this.getAllObjects();
    const found = all.find(o => o.id.toLowerCase() === id.toLowerCase());
    return found || null;
  }
}
