import express from 'express';
import {
  getPublicPrds,
  getPrdBySlug,
  getAdminPrds,
  createPrd,
  updatePrd,
  deletePrd,
} from '../controllers/prd.controller.js';
import { verifyAuth } from '../middleware/auth.middleware.js';
import { verifyAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

router.get('/', getPublicPrds);
router.get('/:slug', getPrdBySlug);

router.get('/admin/all', verifyAuth, verifyAdmin, getAdminPrds);
router.post('/', verifyAuth, verifyAdmin, createPrd);
router.put('/:id', verifyAuth, verifyAdmin, updatePrd);
router.delete('/:id', verifyAuth, verifyAdmin, deletePrd);

export default router;
