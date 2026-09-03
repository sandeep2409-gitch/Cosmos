import express from 'express';
import { explainObject } from '../controllers/aiController.js';

const router = express.Router();

/**
 * POST /api/v1/ai/explain
 * Body: { objectId: string, mode: 'beginner'|'student'|'deepdive', question?: string }
 */
router.post('/ai/explain', explainObject);

export default router;
