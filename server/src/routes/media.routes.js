import express from 'express';
import multer from 'multer';
import {
  getMediaList,
  getMediaSummary,
  uploadMedia,
  updateMedia,
  deleteMedia,
  getMediaDownload,
  UPLOAD_EXTENSIONS,
} from '../controllers/media.controller.js';
import { verifyAuth, verifyAuthOptional } from '../middleware/auth.middleware.js';
import { verifyOwner } from '../middleware/admin.middleware.js';

const router = express.Router();

const allowedMimeTypes = Object.keys(UPLOAD_EXTENSIONS);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit per PRD/audit
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(
        `Unsupported file type: ${file.mimetype || 'unknown'}. Supported: PNG, JPG, WEBP, PDF.`
      );
      error.status = 400;
      error.code = 'UNSUPPORTED_MEDIA_TYPE';
      cb(error, false);
    }
  },
});

// Turn upload validation failures into 400 responses instead of generic server errors
const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        code: 'FILE_TOO_LARGE',
        error: 'File exceeds the 10 MB upload limit.',
      });
    }
    if (err.status === 400 || err.name === 'MulterError') {
      return res.status(400).json({ success: false, code: err.code, error: err.message });
    }
    return next(err);
  });
};

router.get('/list', verifyAuth, verifyOwner, getMediaList);
router.get('/summary', verifyAuth, verifyOwner, getMediaSummary);
router.post('/upload', verifyAuth, verifyOwner, handleUpload, uploadMedia);
router.put('/:id', verifyAuth, verifyOwner, updateMedia);
router.delete('/:id', verifyAuth, verifyOwner, deleteMedia);
router.get('/download/:id', verifyAuthOptional, getMediaDownload);

export default router;
