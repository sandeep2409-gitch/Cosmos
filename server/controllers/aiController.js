import { AIService } from '../services/aiService.js';

/**
 * AI Explanation Controller — Segment 7
 * POST /api/v1/ai/explain
 */
export const explainObject = async (req, res, next) => {
  try {
    const { objectId, mode, question } = req.body;

    // 1. Validate objectId
    if (!objectId || typeof objectId !== 'string') {
      return res.status(400).json({
        success: false,
        error: { status: 400, message: 'objectId is required and must be a string.' }
      });
    }

    // 2. Sanitize objectId — only alphanumeric and hyphens
    const safeId = objectId.replace(/[^a-z0-9\-_]/gi, '').toLowerCase();
    if (!safeId || safeId.length > 60) {
      return res.status(400).json({
        success: false,
        error: { status: 400, message: 'Invalid objectId format.' }
      });
    }

    // 3. Validate and sanitize mode
    const validModes = ['beginner', 'student', 'deepdive'];
    const safeMode = validModes.includes(mode) ? mode : 'beginner';

    // 4. Validate and sanitize custom question
    let safeQuestion = null;
    if (question && typeof question === 'string') {
      // Strip any HTML/script injection attempts
      safeQuestion = question
        .replace(/<[^>]+>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim()
        .substring(0, 250); // max 250 chars for user questions
      if (!safeQuestion) safeQuestion = null;
    }

    // 5. Delegate to AIService (API key never touches this controller)
    const result = await AIService.generateExplanation(safeId, safeMode, safeQuestion);

    // 6. Return normalized response — never expose raw provider response
    if (!result.success) {
      return res.status(200).json(result); // 200 with success:false for soft errors
    }

    return res.status(200).json(result);

  } catch (err) {
    next(err);
  }
};
