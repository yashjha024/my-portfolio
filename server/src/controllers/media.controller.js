import { cloudinary } from '../config/cloudinary.js';

export const uploadMediaController = async (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return res.status(400).json({ success: false, error: 'No files provided for upload' });
    }

    const fileOrFiles = req.file || req.files;
    res.status(200).json({
      success: true,
      message: 'Media uploaded successfully to Cloudinary',
      data: fileOrFiles,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMediaController = async (req, res, next) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ success: false, error: 'Cloudinary publicId is required' });
    }

    const result = await cloudinary.uploader.destroy(publicId);
    res.status(200).json({
      success: true,
      message: 'Media deleted from Cloudinary',
      result,
    });
  } catch (error) {
    next(error);
  }
};
