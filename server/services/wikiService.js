import { ENV } from '../config/env.js';

/**
 * Service Layer Stub for Future Wikipedia/Wikimedia API Integration (Segment 6)
 */
export class WikiService {
  static async fetchSummary(objectName) {
    // Stub implementation for Segment 5 foundation
    return {
      name: objectName,
      wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(objectName)}`,
      summary: `Wikipedia summary service stub for ${objectName}. Integration arriving in Segment 6.`,
      status: 'STUB_READY'
    };
  }
}
