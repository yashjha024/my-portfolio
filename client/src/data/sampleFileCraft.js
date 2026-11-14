/**
 * Dev-only demo entry (VITE_ENABLE_DEMO_DATA) that exercises every interactive case-study block.
 * Facts come from the project dossier; anything not yet confirmed carries a [VERIFY] marker.
 * It doubles as the starting draft for the real FileCraft case study: copy `details` into the
 * admin "Interactive Blocks" tab once each [VERIFY] item is checked against the repository.
 */
export const sampleFileCraft = {
  id: 'cs-filecraft-draft',
  slug: 'filecraft',
  title: 'FileCraft: from a single-purpose PDF renamer to a document workspace',
  summary:
    'FileCraft started as DocRename, a tool that names PDFs from their contents, and grew into one workspace for everyday document jobs: smart renaming, PDF compression, merge, split, and image compression and conversion.',
  type: 'shipped_project',
  status: 'published',
  featured: true,
  sortOrder: 0,
  domain: 'Document workflows',
  role: 'Independent builder [VERIFY: confirm sole ownership]',
  timeline: '[VERIFY: start and end dates]',
  team: '',
  problem:
    'Small document jobs (rename a PDF from what is inside it, compress it, merge or split files, shrink or convert an image) are scattered across separate sites and apps. Each switch costs time and means uploading files to yet another tool.\n\nThis is the product rationale behind the project, not a measured finding: no user research or time-savings data has been collected yet.',
  problemFraming:
    'How might one workspace handle the small document jobs people repeat, so they stop hopping between single-purpose tools?',
  delivery:
    'Backend: Python and FastAPI with async endpoints, SQLite through aiosqlite, PyMuPDF for PDF operations and text extraction, Pillow for images, and Ghostscript as an optional dependency for some compression paths.\n\nFrontend: React, TypeScript and Vite, with Zustand for state, React Router and Axios.\n\n[VERIFY: current OCR engine — RapidOCR or PaddleOCR — from the requirements file]',
  outcomeLearning:
    'Core tools are implemented, but production deployment, end-to-end test coverage, file limits and OCR accuracy are not yet established, so no impact is claimed here.\n\n[VERIFY: what I would build next]',
  metrics: [],
  tools: [
    'FastAPI',
    'Python',
    'SQLite',
    'PyMuPDF',
    'Pillow',
    'React',
    'TypeScript',
    'Vite',
    'Zustand',
  ],
  tags: ['Document processing', 'Full-stack', 'Product scope'],
  gallery: [],
  details: {
    status: { label: 'Core tools built · not deployed', stage: 'partial' },
    lenses: {
      pm: 'The interesting product question was scope: when does a one-feature tool earn the right to become a workspace? Renaming PDFs kept leading to the next job users needed, so the product followed the workflow instead of the original feature.',
      builder:
        'One FastAPI backend runs every tool as a processing job. The key engineering change was moving the job model from one file per job to many files per job, with results stored as JSON metadata.',
    },
    features: [
      {
        name: 'Smart file renaming',
        purpose: 'Reads a document and proposes a filename from its contents',
        status: 'implemented',
        note: '[VERIFY: current pipeline and edge cases]',
      },
      {
        name: 'PDF compression',
        purpose: 'Reduces PDF file size',
        status: 'unverified',
        note: 'Some paths depend on optional Ghostscript',
      },
      { name: 'Merge PDF', purpose: 'Combines several PDFs into one', status: 'implemented' },
      { name: 'Split PDF', purpose: 'Splits a PDF by pages or ranges', status: 'implemented' },
      { name: 'Image compression', purpose: 'Reduces image size (Pillow)', status: 'implemented' },
      {
        name: 'Image conversion',
        purpose: 'Converts between image formats (Pillow)',
        status: 'implemented',
      },
      {
        name: 'Hosted deployment (Supabase + Railway + Docker runner)',
        purpose: 'Persistent metadata, file storage and isolated Ghostscript',
        status: 'proposed',
        note: 'Architecture blueprint only',
      },
    ],
    pipeline: {
      title: 'How a document job flows',
      intro: 'Click a stage to see what it does.',
      stages: [
        { name: 'Upload', summary: 'User selects one or more files', status: 'implemented' },
        {
          name: 'Create job',
          summary: 'A processing job is created for the files',
          status: 'implemented',
          detail: 'The job schema was changed to support several files per job.',
        },
        {
          name: 'Extract',
          summary: 'Text and signals are pulled from the document',
          status: 'implemented',
          detail:
            'PyMuPDF text extraction, with OCR for scanned pages. [VERIFY: active OCR engine]',
        },
        {
          name: 'Process',
          summary: 'Rename, compress, merge, split or convert',
          status: 'implemented',
        },
        {
          name: 'Store result',
          summary: 'Outputs and result_metadata JSON are saved',
          status: 'implemented',
          detail: 'A `result_metadata` JSON column holds per-job result information.',
        },
        {
          name: 'Review & download',
          summary: 'User checks the result and downloads it',
          status: 'implemented',
        },
      ],
    },
    decisions: [
      {
        title: 'Rename DocRename to FileCraft',
        lens: 'pm',
        context: 'The scope had grown past renaming, and the name described only one feature.',
        options: ['Keep DocRename', 'Rename to a broader brand'],
        choice: 'Rename to a broader brand',
        rationale: 'The name should describe the workspace, not the first feature.',
        tradeoff: 'Loses whatever recognition the old name had.',
      },
      {
        title: 'Support many files per job',
        lens: 'builder',
        context: 'Merge needs several inputs, but the job model assumed one file per job.',
        options: ['One job per file', 'Many files per job'],
        choice: 'Many files per job',
        rationale: 'Merge and batch operations become single jobs with one result.',
        tradeoff: 'Schema change plus a new result_metadata column to manage.',
      },
    ],
    timeline: [
      { label: 'DocRename', description: 'Single feature: name PDFs from their contents.' },
      { label: 'Scope expands', description: 'PDF and image tools added alongside renaming.' },
      {
        label: 'Renamed to FileCraft',
        description: 'Name changed to match the broader workspace.',
      },
      { label: 'Multi-file jobs', description: 'Job model reworked for several files per job.' },
    ],
    evidence: [
      {
        claim: 'Merge, split and image tools implemented',
        source: 'GitHub [VERIFY: link]',
        verified: false,
      },
      {
        claim: 'Multi-file job schema and result_metadata',
        source: 'GitHub [VERIFY: commit]',
        verified: false,
      },
    ],
  },
};
