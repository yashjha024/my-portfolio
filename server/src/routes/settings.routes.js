import express from 'express';
import {
  getPublicSettings,
  getAdminSettings,
  updateSettings,
} from '../controllers/settings.controller.js';
import { verifyAuth } from '../middleware/auth.middleware.js';
import { verifyOwner } from '../middleware/admin.middleware.js';

const router = express.Router();

router.get('/', getPublicSettings);
router.get('/admin', verifyAuth, verifyOwner, getAdminSettings);
router.put('/', verifyAuth, verifyOwner, updateSettings);

export default router;
