import { CaseStudy } from '../models/CaseStudy.model.js';

export const getPublicCaseStudies = async (req, res, next) => {
  try {
    const { type, domain, tag } = req.query;
    const filter = { status: 'published' };
    if (type) filter.type = type;
    if (domain) filter.domain = domain;
    if (tag) filter.tags = tag;

    const caseStudies = await CaseStudy.find(filter).sort({ sortOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, count: caseStudies.length, data: caseStudies });
  } catch (error) {
    next(error);
  }
};

export const getCaseStudyBySlug = async (req, res, next) => {
  try {
    const caseStudy = await CaseStudy.findOne({ slug: req.params.slug, status: 'published' });
    if (!caseStudy) {
      return res
        .status(404)
        .json({ success: false, error: 'Case study not found or not published' });
    }
    res.status(200).json({ success: true, data: caseStudy });
  } catch (error) {
    next(error);
  }
};

export const getAdminCaseStudies = async (req, res, next) => {
  try {
    const caseStudies = await CaseStudy.find().sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: caseStudies.length, data: caseStudies });
  } catch (error) {
    next(error);
  }
};

export const createCaseStudy = async (req, res, next) => {
  try {
    const caseStudy = await CaseStudy.create(req.body);
    res.status(201).json({ success: true, data: caseStudy });
  } catch (error) {
    next(error);
  }
};

export const updateCaseStudy = async (req, res, next) => {
  try {
    const caseStudy = await CaseStudy.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!caseStudy) {
      return res.status(404).json({ success: false, error: 'Case study not found' });
    }
    res.status(200).json({ success: true, data: caseStudy });
  } catch (error) {
    next(error);
  }
};

export const deleteCaseStudy = async (req, res, next) => {
  try {
    const caseStudy = await CaseStudy.findByIdAndDelete(req.params.id);
    if (!caseStudy) {
      return res.status(404).json({ success: false, error: 'Case study not found' });
    }
    res.status(200).json({ success: true, message: 'Case study deleted successfully' });
  } catch (error) {
    next(error);
  }
};
