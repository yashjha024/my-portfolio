import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ['teardown', 'feature_proposal', 'essay'],
      required: true,
    },
    excerpt: { type: String, required: true },
    body: { type: String, required: true },
    coverImage: { type: String, default: '' },
    tags: [{ type: String }],
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    publishedAt: { type: Date, default: null },
    readingTime: { type: String, default: '5 min read' },
    disclaimer: { type: String, default: '' },
    relatedWork: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CaseStudy' }],
  },
  {
    timestamps: true,
  }
);

export const Article = mongoose.model('Article', articleSchema);
