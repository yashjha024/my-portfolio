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
import { verifyOwner } from '../middleware/admin.middleware.js';

const router = express.Router();

// Public endpoints
router.get('/', getPublicCaseStudies);
router.get('/slug/:slug', getCaseStudyBySlug);

// Protected admin endpoints
router.get('/admin/all', verifyAuth, verifyOwner, getAdminCaseStudies);
router.post('/', verifyAuth, verifyOwner, createCaseStudy);
router.put('/:id', verifyAuth, verifyOwner, updateCaseStudy);
router.delete('/:id', verifyAuth, verifyOwner, deleteCaseStudy);

export default router;
