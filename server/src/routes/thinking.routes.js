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
import { verifyAdmin } from '../middleware/admin.middleware.js';

const router = express.Router();

router.get('/', getPublicArticles);
router.get('/:slug', getArticleBySlug);

router.get('/admin/all', verifyAuth, verifyAdmin, getAdminArticles);
router.post('/', verifyAuth, verifyAdmin, createArticle);
router.put('/:id', verifyAuth, verifyAdmin, updateArticle);
router.delete('/:id', verifyAuth, verifyAdmin, deleteArticle);

export default router;
