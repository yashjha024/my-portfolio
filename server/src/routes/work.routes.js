import express from 'express';
import {
  getPublicCaseStudies,
  getCaseStudyBySlug,
  getAdminCaseStudies,
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
} from '../controllers/work.controller.js';
import { verifyAuth } from '../middleware/auth.middleware.js';
import { verifyAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

// Public endpoints
router.get('/', getPublicCaseStudies);
router.get('/:slug', getCaseStudyBySlug);

// Protected admin endpoints
router.get('/admin/all', verifyAuth, verifyAdmin, getAdminCaseStudies);
router.post('/', verifyAuth, verifyAdmin, createCaseStudy);
router.put('/:id', verifyAuth, verifyAdmin, updateCaseStudy);
router.delete('/:id', verifyAuth, verifyAdmin, deleteCaseStudy);

export default router;
