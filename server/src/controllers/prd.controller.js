import { Prd } from '../models/Prd.model.js';

export const getPublicPrds = async (req, res, next) => {
  try {
    const prds = await Prd.find({ visibility: 'public', status: 'published' }).sort({
      updatedAt: -1,
    });
    res.status(200).json({ success: true, count: prds.length, data: prds });
  } catch (error) {
    next(error);
  }
};

export const getPrdBySlug = async (req, res, next) => {
  try {
    const prd = await Prd.findOne({ slug: req.params.slug }).populate('relatedCaseStudy');
    if (!prd) {
      return res.status(404).json({ success: false, error: 'PRD not found' });
    }

    // Visibility rules per PRD Section 6
    if (prd.visibility === 'private' && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, error: 'Access denied: Private PRD artifact' });
    }
    if (prd.status !== 'published' && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({ success: false, error: 'PRD not found or not published' });
    }

    res.status(200).json({ success: true, data: prd });
  } catch (error) {
    next(error);
  }
};

export const getAdminPrds = async (req, res, next) => {
  try {
    const prds = await Prd.find().sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: prds.length, data: prds });
  } catch (error) {
    next(error);
  }
};

export const createPrd = async (req, res, next) => {
  try {
    const prd = await Prd.create(req.body);
    res.status(201).json({ success: true, data: prd });
  } catch (error) {
    next(error);
  }
};

export const updatePrd = async (req, res, next) => {
  try {
    const prd = await Prd.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!prd) {
      return res.status(404).json({ success: false, error: 'PRD not found' });
    }
    res.status(200).json({ success: true, data: prd });
  } catch (error) {
    next(error);
  }
};

export const deletePrd = async (req, res, next) => {
  try {
    const prd = await Prd.findByIdAndDelete(req.params.id);
    if (!prd) {
      return res.status(404).json({ success: false, error: 'PRD not found' });
    }
    res.status(200).json({ success: true, message: 'PRD deleted successfully' });
  } catch (error) {
    next(error);
  }
};
