import mongoose from 'mongoose';

const metricSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
  qualifier: {
    type: String,
    enum: ['actual', 'estimated', 'learning'],
    default: 'actual',
  },
});

const caseStudySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    summary: { type: String, required: true, maxlength: 180 },
    type: {
      type: String,
      enum: ['shipped_project', 'product_case_study', 'program_case_study'],
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    role: { type: String, required: true },
    timeline: { type: String, required: true },
    team: { type: String, default: '' },
    domain: { type: String, required: true },
    problem: { type: String, required: true },
    approach: { type: String, required: true },
    outcome: { type: String, required: true },
    metrics: [metricSchema],
    tools: [{ type: String }],
    tags: [{ type: String }],
    coverImage: { type: String, default: '' },
    gallery: [{ type: String }],
    liveUrl: { type: String, default: '' },
    repoUrl: { type: String, default: '' },
    prototypeUrl: { type: String, default: '' },
    prdUrl: { type: String, default: '' },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    ogImage: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

export const CaseStudy = mongoose.model('CaseStudy', caseStudySchema);
