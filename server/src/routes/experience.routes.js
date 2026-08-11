import express from 'express';
import { getPublicExperiences } from '../controllers/experience.controller.js';

const router = express.Router();

router.get('/', getPublicExperiences);

export default router;
