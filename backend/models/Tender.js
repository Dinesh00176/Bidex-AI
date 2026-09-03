const mongoose = require('mongoose');

const extractedPageSchema = new mongoose.Schema({
  pageNumber: {
    type: Number,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  wordCount: {
    type: Number,
    default: 0
  }
});

const tenderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null
    },
    title: {
      type: String,
      required: [true, 'Tender title is required'],
      trim: true
    },
    organization: {
      type: String,
      default: 'Procurement Authority',
      trim: true
    },
    referenceNumber: {
      type: String,
      default: '',
      trim: true
    },
    estimatedValue: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    deadline: {
      type: Date,
      default: null
    },
    location: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'failed'],
      default: 'uploaded',
      index: true
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    progressStep: {
      type: String,
      default: 'Uploaded'
    },
    errorMessage: {
      type: String,
      default: ''
    },
    filePath: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      default: 'application/pdf'
    },
    pageCount: {
      type: Number,
      default: 0
    },
    extractedPages: {
      type: [extractedPageSchema],
      default: []
    },
    summary: {
      type: String,
      default: ''
    },
    scopeOfWork: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Tender', tenderSchema);
