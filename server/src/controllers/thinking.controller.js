import { Article } from '../models/Article.model.js';

export const getPublicArticles = async (req, res, next) => {
  try {
    const { type, tag } = req.query;
    const filter = { status: 'published' };
    if (type) filter.type = type;
    if (tag) filter.tags = tag;

    const articles = await Article.find(filter).sort({ publishedAt: -1, createdAt: -1 });
    res.status(200).json({ success: true, count: articles.length, data: articles });
  } catch (error) {
    next(error);
  }
};

export const getArticleBySlug = async (req, res, next) => {
  try {
    const article = await Article.findOne({ slug: req.params.slug, status: 'published' }).populate(
      'relatedWork'
    );
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found or not published' });
    }
    res.status(200).json({ success: true, data: article });
  } catch (error) {
    next(error);
  }
};

export const getAdminArticles = async (req, res, next) => {
  try {
    const articles = await Article.find().sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: articles.length, data: articles });
  } catch (error) {
    next(error);
  }
};

export const createArticle = async (req, res, next) => {
  try {
    const article = await Article.create(req.body);
    res.status(201).json({ success: true, data: article });
  } catch (error) {
    next(error);
  }
};

export const updateArticle = async (req, res, next) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }
    res.status(200).json({ success: true, data: article });
  } catch (error) {
    next(error);
  }
};

export const deleteArticle = async (req, res, next) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }
    res.status(200).json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    next(error);
  }
};
