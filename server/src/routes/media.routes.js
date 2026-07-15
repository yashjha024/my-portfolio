import express from 'express';
import { uploadMediaController, deleteMediaController } from '../controllers/media.controller.js';
import { verifyAuth } from '../middleware/auth.middleware.js';
import { verifyAdmin } from '../middleware/admin.middleware.js';
import { uploadMedia } from '../config/cloudinary.js';

const router = express.Router();

router.post(
  '/upload',
  verifyAuth,
  verifyAdmin,
  uploadMedia.array('files', 10),
  uploadMediaController
);
router.delete('/delete', verifyAuth, verifyAdmin, deleteMediaController);

export default router;
