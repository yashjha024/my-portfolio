import mongoose from 'mongoose';

const prdSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    context: { type: String, required: true },
    stage: { type: String, default: 'Concept' },
    visibility: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'private',
      index: true,
    },
    goal: { type: String, default: '' },
    nonGoals: [{ type: String }],
    requirements: [{ type: String }],
    successMetrics: [{ type: String }],
    pdfUrl: { type: String, default: '' },
    relatedCaseStudy: { type: mongoose.Schema.Types.ObjectId, ref: 'CaseStudy', default: null },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

export const Prd = mongoose.model('Prd', prdSchema);
