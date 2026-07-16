import express from 'express';
import {
  getPublicArticles,
  getArticleBySlug,
  getAdminArticles,
  createArticle,
  updateArticle,
  deleteArticle,
} from '../controllers/thinking.controller.js';
import { verifyAuth } from '../middleware/auth.middleware.js';
import { verifyOwner } from '../middleware/admin.middleware.js';

const router = express.Router();

router.get('/', getPublicArticles);
router.get('/slug/:slug', getArticleBySlug);

router.get('/admin/all', verifyAuth, verifyOwner, getAdminArticles);
router.post('/', verifyAuth, verifyOwner, createArticle);
router.put('/:id', verifyAuth, verifyOwner, updateArticle);
router.delete('/:id', verifyAuth, verifyOwner, deleteArticle);

export default router;
