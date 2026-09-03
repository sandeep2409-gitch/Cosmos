import { PLANETS_DATA, SUN_CONFIG } from '../config/planetsData.js';
import { SATELLITES_DATA } from '../config/satellitesData.js';
import { ARTIFICIAL_SATELLITES_DATA } from '../config/artificialSatellitesData.js';

/**
 * Frontend COSMOS API Service Client
 * Fetches object metadata & Wikipedia summaries from Express backend with automatic local fallback.
 */
export class CosmosApi {
  static baseUrl = 'http://localhost:5000/api/v1';

  static async getObjectById(id) {
    try {
      const response = await fetch(`${this.baseUrl}/objects/${id}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn(`[COSMOS API] Backend unreachable at ${this.baseUrl}. Falling back to local static dataset for '${id}'.`);
    }

    // Local Dataset Fallback
    const all = [
      SUN_CONFIG,
      ...PLANETS_DATA,
      ...SATELLITES_DATA,
      ...ARTIFICIAL_SATELLITES_DATA
    ];

    return all.find(o => o.id.toLowerCase() === id.toLowerCase()) || null;
  }

  static async getWikipediaData(id) {
    try {
      const response = await fetch(`${this.baseUrl}/wikipedia/${id}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.wikipedia) {
          return json.wikipedia;
        }
      }
    } catch (err) {
      console.warn(`[COSMOS API] Wikipedia backend endpoint unreachable for '${id}'.`);
    }
    return null;
  }
}
