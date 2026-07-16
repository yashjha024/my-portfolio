import express from 'express';
import { getDynamicSitemap, getDynamicRssFeed } from '../controllers/seo.controller.js';

const router = express.Router();

router.get('/sitemap.xml', getDynamicSitemap);
router.get('/rss.xml', getDynamicRssFeed);

export default router;
