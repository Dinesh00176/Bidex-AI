const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  docType: {
    type: String,
    enum: ['ISO Certificate', 'Audit Report', 'Project Completion', 'Tax Clearance', 'Company Profile', 'Technical Capability', 'Other'],
    default: 'Other'
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  extractedSummary: {
    type: String,
    default: ''
  },
  extractedKeyFacts: {
    type: [String],
    default: []
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const pastProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  client: {
    type: String,
    trim: true
  },
  value: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  year: {
    type: Number
  },
  category: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    default: ''
  }
});

const companySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    industry: {
      type: String,
      default: 'Information Technology & Smart Infrastructure'
    },
    yearsExperience: {
      type: Number,
      default: 0,
      min: [0, 'Years of experience cannot be negative']
    },
    annualTurnover: {
      type: Number,
      default: 0,
      min: [0, 'Turnover cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    employeeCount: {
      type: Number,
      default: 0
    },
    certifications: {
      type: [String],
      default: []
    },
    technicalSkills: {
      type: [String],
      default: []
    },
    services: {
      type: [String],
      default: []
    },
    locations: {
      type: [String],
      default: []
    },
    previousProjects: {
      type: [pastProjectSchema],
      default: []
    },
    documents: {
      type: [documentSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Company', companySchema);
