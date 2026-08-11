import express from 'express';
import { verifyAuth } from '../middleware/auth.middleware.js';
import { verifyOwner } from '../middleware/admin.middleware.js';
import { getDashboardStats, getAuditLogs } from '../controllers/dashboard.controller.js';
import {
  getAdminCaseStudies,
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
} from '../controllers/work.controller.js';
import {
  getAdminArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} from '../controllers/thinking.controller.js';
import { getAdminPrds, createPrd, updatePrd, deletePrd } from '../controllers/prd.controller.js';
import mediaRoutes from './media.routes.js';
import { getAdminSettings, updateSettings } from '../controllers/settings.controller.js';
import {
  getAdminMessages,
  updateMessageStatus,
  deleteMessage,
} from '../controllers/messages.controller.js';
import {
  getAdminExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
} from '../controllers/experience.controller.js';
import {
  getAdminEducations,
  createEducation,
  updateEducation,
  deleteEducation,
} from '../controllers/education.controller.js';

const router = express.Router();

// Enforce authentication & owner role on ALL admin routes
router.use(verifyAuth, verifyOwner);

// Dashboard stats & activity
router.get('/dashboard', getDashboardStats);
router.get('/audit-logs', getAuditLogs);

// Work / Case Studies CMS
router.get('/work', getAdminCaseStudies);
router.post('/work', createCaseStudy);
router.put('/work/:id', updateCaseStudy);
router.delete('/work/:id', deleteCaseStudy);

// Thinking / Articles CMS
router.get('/thinking', getAdminArticles);
router.post('/thinking', createArticle);
router.put('/thinking/:id', updateArticle);
router.delete('/thinking/:id', deleteArticle);

// PRDs CMS
router.get('/prds', getAdminPrds);
router.post('/prds', createPrd);
router.put('/prds/:id', updatePrd);
router.delete('/prds/:id', deletePrd);

// Media Library CMS
router.use('/media', mediaRoutes);

// Site Settings CMS
router.get('/settings', getAdminSettings);
router.put('/settings', updateSettings);

// Messages / Inquiries CMS
router.get('/messages', getAdminMessages);
router.put('/messages/:id/status', updateMessageStatus);
router.delete('/messages/:id', deleteMessage);

// Experience CMS
router.get('/experiences', getAdminExperiences);
router.post('/experiences', createExperience);
router.put('/experiences/:id', updateExperience);
router.delete('/experiences/:id', deleteExperience);

// Education CMS
router.get('/educations', getAdminEducations);
router.post('/educations', createEducation);
router.put('/educations/:id', updateEducation);
router.delete('/educations/:id', deleteEducation);

export default router;
