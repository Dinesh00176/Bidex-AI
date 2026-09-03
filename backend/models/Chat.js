const mongoose = require('mongoose');

const citationSchema = new mongoose.Schema({
  sourcePage: {
    type: Number,
    required: true
  },
  sectionTitle: {
    type: String,
    default: 'Tender Clause'
  },
  quotedSnippet: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    default: 0.9
  }
});

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  citations: {
    type: [citationSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema(
  {
    tenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tender',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    messages: {
      type: [messageSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Chat', chatSchema);
