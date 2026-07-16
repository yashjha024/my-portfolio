import express from 'express';
import multer from 'multer';
import {
  getMediaList,
  uploadMedia,
  updateMedia,
  deleteMedia,
} from '../controllers/media.controller.js';
import { verifyAuth } from '../middleware/auth.middleware.js';
import { verifyOwner } from '../middleware/admin.middleware.js';

const router = express.Router();

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit per PRD/audit
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`
        ),
        false
      );
    }
  },
});

router.get('/list', verifyAuth, verifyOwner, getMediaList);
router.post('/upload', verifyAuth, verifyOwner, upload.single('file'), uploadMedia);
router.put('/:id', verifyAuth, verifyOwner, updateMedia);
router.delete('/:id', verifyAuth, verifyOwner, deleteMedia);

export default router;
