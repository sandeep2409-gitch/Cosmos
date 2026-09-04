import { PLANETS_DATA, SUN_CONFIG } from '../config/planetsData.js';
import { SATELLITES_DATA } from '../config/satellitesData.js';
import { ARTIFICIAL_SATELLITES_DATA } from '../config/artificialSatellitesData.js';

/**
 * Frontend COSMOS API Service Client
 * Fetches object metadata & Wikipedia summaries from Express backend with automatic local fallback.
 */
export class CosmosApi {
  static baseUrl = 'http://localhost:5001/api/v1';

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

  /**
   * POST /api/v1/ai/explain — request AI explanation for a celestial object
   * @param {string} id - Object ID (e.g. 'earth', 'moon', 'aryabhata')
   * @param {string} mode - 'beginner' | 'student' | 'deepdive'
   * @param {string|null} question - Optional custom question
   * @returns {Promise<{success:boolean, explanation?:string, error?:string, errorCode?:string}>}
   */
  static async getAIExplanation(id, mode = 'beginner', question = null) {
    try {
      const body = { objectId: id, mode };
      if (question) body.question = question;

      const response = await fetch(`${this.baseUrl}/ai/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const json = await response.json();
        return json;
      }
      return { success: false, error: 'AI service returned an error.', errorCode: 'HTTP_ERROR' };
    } catch (err) {
      console.warn(`[COSMOS API] AI backend endpoint unreachable for '${id}'. Using local static fallback.`);
      const obj = await this.getObjectById(id);
      if (!obj) {
        return { success: false, error: `Object '${id}' not found.`, errorCode: 'OBJECT_NOT_FOUND' };
      }
      return {
        success: true,
        objectId: id,
        objectName: obj.name,
        mode,
        source: 'COSMOS Scientific Engine (Offline Fallback)',
        explanation: this._generateClientFallback(obj, mode, question),
        generatedAt: new Date().toISOString(),
        cached: false
      };
    }
  }

  static _generateClientFallback(obj, mode, question) {
    const name = obj.name || 'Celestial Object';
    const type = obj.type || obj.category || 'celestial body';
    const desc = obj.description || '';

    if (question) {
      return `${name} (${type}) is a prominent subject of astronomical study.\n\nRegarding "${question}": Based on COSMOS scientific records, ${desc}\n\nKey parameters for ${name}: Diameter: ${obj.diameter || 'N/A'}, Orbital Period: ${obj.orbitalPeriod || 'N/A'}, Rotation Period: ${obj.rotationPeriod || 'N/A'}.`;
    }

    if (mode === 'beginner') {
      return `${name} is a fascinating ${type} in our solar system. ${desc}\n\nWith a diameter of ${obj.diameter || 'N/A'} and an orbital period of ${obj.orbitalPeriod || 'N/A'}, ${name} offers space explorers vital insights into planetary astronomy.`;
    } else if (mode === 'student') {
      return `${name} is classified as a ${type}. ${desc}\n\nPhysical and orbital metrics: Diameter: ${obj.diameter || 'N/A'}, Mass: ${obj.mass || 'N/A'}, Surface Temperature: ${obj.surfaceTemp || 'N/A'}, and Orbital Period: ${obj.orbitalPeriod || 'N/A'}.`;
    } else {
      return `${name} represents a major target of observational planetary science. Categorized as a ${type}, it plays a distinct role in solar system dynamics.\n\n${desc}\n\nDetailed profile: Diameter: ${obj.diameter || 'N/A'} | Mass: ${obj.mass || 'N/A'} | Atmosphere: ${obj.atmosphere || 'N/A'} | Composition: ${obj.composition || 'N/A'} | Rotation: ${obj.rotationPeriod || 'N/A'}.`;
    }
  }
}
