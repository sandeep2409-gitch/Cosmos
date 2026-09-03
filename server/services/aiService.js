import { ENV } from '../config/env.js';
import { ObjectService } from './objectService.js';
import { WikiService } from './wikiService.js';

/**
 * COSMOS AI Explanation Service — Segment 7
 *
 * Architecture:
 *   Frontend → POST /api/v1/ai/explain → aiService → AI Provider (server-side only)
 *
 * Security:
 *   - AI_API_KEY never leaves the server
 *   - Client cannot supply system prompts or override AI URL
 *   - AI output is sanitized before returning to client
 *
 * Caching:
 *   - In-memory cache keyed by `${objectId}::${mode}::${questionHash}`
 *   - TTL: 30 minutes
 */
export class AIService {
  static cache = new Map();
  static CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
  static REQUEST_TIMEOUT_MS = 25000;     // 25 second timeout

  // Supported explanation modes
  static MODES = {
    beginner: {
      label: 'Beginner',
      instruction: 'Explain this object using very simple, clear language suitable for someone completely new to astronomy. Avoid jargon. Use short sentences and relatable analogies. Keep the response to 2–3 concise paragraphs.',
      maxTokens: 400
    },
    student: {
      label: 'Student',
      instruction: 'Explain this object at a college-student level with moderate scientific detail. Include key scientific concepts, measurements, and why this object matters to science. Keep the response to 2–4 concise paragraphs.',
      maxTokens: 550
    },
    deepdive: {
      label: 'Deep Dive',
      instruction: 'Give a deeper scientific explanation of this object while remaining understandable to an educated general audience. Include physical properties, scientific significance, and current research context. Keep the response to 3–5 paragraphs.',
      maxTokens: 750
    }
  };

  /**
   * Generate an AI explanation for a space object
   * @param {string} objectId - COSMOS object ID (e.g., 'earth', 'moon', 'aryabhata')
   * @param {string} mode - 'beginner' | 'student' | 'deepdive'
   * @param {string|null} question - Optional custom question from user
   * @returns {Promise<{success: boolean, explanation: string, objectId: string, mode: string, source: string, generatedAt: string, cached: boolean}>}
   */
  static async generateExplanation(objectId, mode = 'beginner', question = null) {
    // 1. Validate mode
    const modeConfig = this.MODES[mode] || this.MODES.beginner;

    // 2. Check API key
    if (!ENV.AI_API_KEY) {
      return this._errorResponse(objectId, mode, 'AI_KEY_MISSING', 'AI explanation is not configured on this server.');
    }

    // 3. Determine API endpoint
    const apiUrl = ENV.AI_API_URL || 'https://api.groq.com/openai/v1/chat/completions';

    // 4. Look up object from COSMOS local data
    const object = ObjectService.getObjectById(objectId);
    if (!object) {
      return this._errorResponse(objectId, mode, 'OBJECT_NOT_FOUND', `Object '${objectId}' not found in COSMOS database.`);
    }

    // 5. Check in-memory cache
    const cacheKey = this._buildCacheKey(objectId, mode, question);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.data, cached: true };
    }

    // 6. Try to get Wikipedia summary for factual grounding
    let wikiSummary = null;
    try {
      const wikiResult = await WikiService.getWikipediaSummary(objectId);
      if (wikiResult && wikiResult.wikipedia && wikiResult.wikipedia.summary) {
        wikiSummary = wikiResult.wikipedia.summary.substring(0, 800); // cap to avoid huge prompts
      }
    } catch (_) {
      // Wikipedia unavailable is non-fatal — AI can still use COSMOS local data
    }

    // 7. Build the controlled prompt
    const { systemPrompt, userPrompt } = this._buildPrompts(object, modeConfig, wikiSummary, question);

    // 8. Call the AI provider
    try {
      const explanation = await this._callProvider(apiUrl, systemPrompt, userPrompt, modeConfig.maxTokens);

      // 9. Sanitize output
      const sanitized = this._sanitize(explanation);

      const result = {
        success: true,
        objectId,
        objectName: object.name,
        mode,
        source: 'AI',
        explanation: sanitized,
        generatedAt: new Date().toISOString(),
        cached: false
      };

      // 10. Store in cache
      this.cache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + this.CACHE_TTL_MS
      });

      return result;

    } catch (err) {
      console.error(`[AIService Error for '${objectId}']:`, err.message);
      return this._classifyError(objectId, mode, err);
    }
  }

  /**
   * Build controlled system + user prompts from COSMOS data and Wikipedia
   */
  static _buildPrompts(object, modeConfig, wikiSummary, question) {
    const objectType = this._detectObjectCategory(object);

    // Build factual context block
    const cosmosFacts = this._buildFactBlock(object);

    // System prompt — AI may NOT override this from the client side
    const systemPrompt = `You are COSMOS Assistant, an astronomy explainer for the COSMOS interactive solar system app.

STRICT RULES:
- Only use the factual context provided below to discuss specific facts, dates, measurements, or discoveries.
- Do NOT invent numerical values, mission dates, or scientific measurements.
- Do NOT fabricate current satellite positions, live telemetry, or real-time tracking data.
- Do NOT claim to have access to real-time data.
- If the context does not contain the answer, say: "The available COSMOS information does not provide enough detail on that."
- Never inject HTML, JavaScript, or markup into your response.
- Respond in plain text only. No markdown headers, bullet points, or bold formatting.
- Avoid starting your response with "I" or "As an AI".

YOUR TASK:
${modeConfig.instruction}

OBJECT TYPE CONTEXT:
${objectType}`;

    // User prompt — contains the controlled factual context
    const userMsg = `
OBJECT: ${object.name}

COSMOS FACTS:
${cosmosFacts}

${wikiSummary ? `WIKIPEDIA SUMMARY:\n${wikiSummary}` : '(Wikipedia summary not available — use COSMOS facts above.)'}

${question
      ? `USER QUESTION: ${question}\n\nPlease answer the user's question about this object using only the factual context above.`
      : `Please explain this object to a ${modeConfig.label.toLowerCase()}-level audience.`
    }
`.trim();

    return { systemPrompt, userPrompt: userMsg };
  }

  /**
   * Build a structured block of object facts for the AI
   */
  static _buildFactBlock(obj) {
    const lines = [];
    if (obj.type || obj.category) lines.push(`Type: ${obj.type || obj.category}`);
    if (obj.positionFromSun) lines.push(`Position: ${obj.positionFromSun}`);
    if (obj.diameter) lines.push(`Diameter: ${obj.diameter}`);
    if (obj.mass) lines.push(`Mass: ${obj.mass}`);
    if (obj.distanceFromSun) lines.push(`Distance from Sun: ${obj.distanceFromSun}`);
    if (obj.distanceFromPlanet) lines.push(`Distance from Planet: ${obj.distanceFromPlanet}`);
    if (obj.orbitalPeriod) lines.push(`Orbital Period: ${obj.orbitalPeriod}`);
    if (obj.rotationPeriod) lines.push(`Rotation Period: ${obj.rotationPeriod}`);
    if (obj.surfaceTemp) lines.push(`Surface Temperature: ${obj.surfaceTemp}`);
    if (obj.atmosphere) lines.push(`Atmosphere: ${obj.atmosphere}`);
    if (obj.composition) lines.push(`Composition: ${obj.composition}`);
    if (obj.missionType) lines.push(`Mission Type: ${obj.missionType}`);
    if (obj.orbitType) lines.push(`Orbit Type: ${obj.orbitType}`);
    if (obj.launchYear) lines.push(`Launch Year: ${obj.launchYear}`);
    if (obj.countryAgency) lines.push(`Agency/Country: ${obj.countryAgency}`);
    if (obj.status) lines.push(`Status: ${obj.status}`);
    if (obj.significance) lines.push(`Significance: ${obj.significance}`);
    if (obj.description) lines.push(`Description: ${obj.description}`);
    return lines.join('\n');
  }

  /**
   * Classify the object type for the AI context
   */
  static _detectObjectCategory(obj) {
    if (obj.type === 'Star (G2V Yellow Dwarf)') return 'This is a STAR (the Sun, center of the Solar System).';
    if (obj.type === 'planet') return 'This is a PLANET in our Solar System.';
    if (obj.type === 'satellite' || obj.type === 'Natural Satellite' || obj.type === 'Galilean Satellite') {
      return `This is a NATURAL MOON orbiting ${obj.parentPlanetId || 'a planet'}. Explain what makes this moon scientifically interesting, its orbital characteristics, and environment.`;
    }
    if (obj.category === 'artificial') {
      const template = obj.visualTemplate || '';
      if (template === 'telescope') return 'This is a SPACE TELESCOPE. Explain what it observes, why it was built, and its scientific achievements.';
      if (template === 'probe') return 'This is a SPACE PROBE or deep-space mission. Explain its destination, purpose, and major achievements.';
      return 'This is an ARTIFICIAL SATELLITE or spacecraft. Explain its mission, orbit, launch era, and importance.';
    }
    return 'This is a celestial object or spacecraft.';
  }

  /**
   * Call the AI provider (OpenAI-compatible REST API)
   */
  static async _callProvider(apiUrl, systemPrompt, userPrompt, maxTokens) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ENV.AI_API_KEY}`
        },
        body: JSON.stringify({
          model: ENV.AI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: maxTokens,
          temperature: 0.6,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.status === 401) {
        throw new Error('AI_AUTH_FAILED');
      }
      if (response.status === 429) {
        throw new Error('AI_RATE_LIMITED');
      }
      if (response.status === 503 || response.status === 502) {
        throw new Error('AI_PROVIDER_UNAVAILABLE');
      }
      if (!response.ok) {
        throw new Error(`AI_HTTP_${response.status}`);
      }

      const json = await response.json();

      // Validate response structure
      if (!json.choices || !json.choices[0] || !json.choices[0].message || !json.choices[0].message.content) {
        throw new Error('AI_INVALID_RESPONSE');
      }

      const text = json.choices[0].message.content.trim();
      if (!text || text.length < 20) {
        throw new Error('AI_EMPTY_RESPONSE');
      }

      return text;

    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('AI_TIMEOUT');
      }
      throw err;
    }
  }

  /**
   * Sanitize AI output — strip HTML, script tags, event handlers
   */
  static _sanitize(text) {
    if (!text || typeof text !== 'string') return '';
    return text
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+on\w+\s*=\s*["'][^"']*["'][^>]*>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;script/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')   // strip markdown bold
      .replace(/#{1,6}\s/g, '')          // strip markdown headers
      .replace(/^\s*[-*•]\s/gm, '')      // strip markdown bullets
      .replace(/\n{3,}/g, '\n\n')        // collapse excess newlines
      .trim()
      .substring(0, 3000);              // hard cap at 3000 chars
  }

  static _buildCacheKey(objectId, mode, question) {
    const qHash = question ? question.substring(0, 60).replace(/\s+/g, '_') : 'default';
    return `${objectId}::${mode}::${qHash}`;
  }

  static _errorResponse(objectId, mode, code, message) {
    return {
      success: false,
      objectId,
      mode,
      errorCode: code,
      error: message,
      generatedAt: new Date().toISOString()
    };
  }

  static _classifyError(objectId, mode, err) {
    const msg = err.message || '';
    const map = {
      'AI_AUTH_FAILED': 'The AI API key is invalid or expired.',
      'AI_RATE_LIMITED': 'The AI service is temporarily rate limited. Please try again in a moment.',
      'AI_PROVIDER_UNAVAILABLE': 'The AI provider is temporarily unavailable.',
      'AI_TIMEOUT': 'The AI request timed out. Please try again.',
      'AI_INVALID_RESPONSE': 'The AI returned an unexpected response format.',
      'AI_EMPTY_RESPONSE': 'The AI returned an empty response.'
    };
    const humanMsg = map[msg] || 'An unexpected error occurred with the AI service.';
    return this._errorResponse(objectId, mode, msg || 'AI_ERROR', humanMsg);
  }

  /**
   * Clear the full cache (for testing)
   */
  static clearCache() {
    this.cache.clear();
  }
}
