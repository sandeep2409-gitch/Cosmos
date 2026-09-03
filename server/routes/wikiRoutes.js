import express from 'express';
import { getWikipediaData } from '../controllers/wikiController.js';

const router = express.Router();

router.get('/wikipedia/:id', getWikipediaData);

export default router;
