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
import { verifyOwner } from '../middleware/admin.middleware.js';

const router = express.Router();

router.get('/', getPublicPrds);
router.get('/slug/:slug', getPrdBySlug);

router.get('/admin/all', verifyAuth, verifyOwner, getAdminPrds);
router.post('/', verifyAuth, verifyOwner, createPrd);
router.put('/:id', verifyAuth, verifyOwner, updatePrd);
router.delete('/:id', verifyAuth, verifyOwner, deletePrd);

export default router;
