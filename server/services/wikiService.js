import { ObjectService } from './objectService.js';

/**
 * Service Layer for Official Wikipedia & Wikimedia Integration (Segment 6)
 * Features MediaWiki REST API querying, title resolution fallback, and 1-hour in-memory caching.
 */
export class WikiService {
  static cache = new Map(); // key: objectId, value: { data, expiresAt }
  static CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

  static async getWikipediaSummary(objectId) {
    const object = ObjectService.getObjectById(objectId);
    if (!object) return null;

    // Check In-Memory Cache first
    const cached = this.cache.get(objectId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const titleQuery = object.wikipediaTitle || object.name;

    try {
      // 1. Try MediaWiki REST Summary API first
      let wikiData = await this.fetchRestSummary(titleQuery);

      // 2. If 404 or disambiguation, attempt MediaWiki Search fallback
      if (!wikiData || wikiData.type === 'disambiguation') {
        const searchTitle = await this.searchWikipediaTitle(object.name);
        if (searchTitle && searchTitle !== titleQuery) {
          wikiData = await this.fetchRestSummary(searchTitle);
        }
      }

      if (!wikiData) {
        return null;
      }

      // 3. Normalize into clean COSMOS schema
      const normalized = {
        title: wikiData.title || object.name,
        summary: wikiData.extract || object.description,
        description: wikiData.description || object.type || '',
        image: wikiData.thumbnail ? wikiData.thumbnail.source : null,
        pageUrl: wikiData.content_urls ? wikiData.content_urls.desktop.page : `https://en.wikipedia.org/wiki/${encodeURIComponent(titleQuery)}`
      };

      const resultPayload = {
        success: true,
        source: 'Wikipedia',
        object: {
          id: object.id,
          name: object.name
        },
        wikipedia: normalized
      };

      // Store in memory cache
      this.cache.set(objectId, {
        data: resultPayload,
        expiresAt: Date.now() + this.CACHE_TTL_MS
      });

      return resultPayload;
    } catch (err) {
      console.error(`[WikiService Error for '${objectId}']:`, err.message);
      return null;
    }
  }

  static async fetchRestSummary(title) {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'COSMOS-Space-Explorer/1.0 (https://github.com/cosmos-app)'
      }
    });

    if (response.status === 200) {
      return await response.json();
    }
    return null;
  }

  static async searchWikipediaTitle(query) {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'COSMOS-Space-Explorer/1.0 (https://github.com/cosmos-app)'
      }
    });

    if (response.ok) {
      const json = await response.json();
      if (json.query && json.query.search && json.query.search.length > 0) {
        return json.query.search[0].title;
      }
    }
    return null;
  }
}
