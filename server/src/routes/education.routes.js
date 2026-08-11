import express from 'express';
import { getPublicEducations } from '../controllers/education.controller.js';

const router = express.Router();

router.get('/', getPublicEducations);

export default router;
