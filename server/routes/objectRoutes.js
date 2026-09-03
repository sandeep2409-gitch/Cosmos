import express from 'express';
import { getAllObjects, getObjectById } from '../controllers/objectController.js';

const router = express.Router();

router.get('/objects', getAllObjects);
router.get('/objects/:id', getObjectById);

export default router;
