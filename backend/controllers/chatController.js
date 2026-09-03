const Chat = require('../models/Chat');
const Tender = require('../models/Tender');
const Analysis = require('../models/Analysis');
const { answerTenderQuestion } = require('../services/ragService');
const logger = require('../utils/logger');

/**
 * @route   POST /api/tenders/:id/chat
 * @desc    Ask tender assistant question with RAG page citations
 * @access  Private
 */
const askTenderChat = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question || question.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid question.'
      });
    }

    const tender = await Tender.findById(req.params.id);
    if (!tender) {
      return res.status(404).json({ success: false, message: 'Tender not found' });
    }

    const analysis = await Analysis.findOne({ tenderId: tender._id });

    // Retrieve or create Chat session
    let chat = await Chat.findOne({ tenderId: tender._id, userId: req.user._id });
    if (!chat) {
      chat = new Chat({
        tenderId: tender._id,
        userId: req.user._id,
        messages: []
      });
    }

    // Append user message
    chat.messages.push({
      role: 'user',
      content: question.trim(),
      citations: [],
      createdAt: new Date()
    });

    // Run RAG response
    const ragResult = await answerTenderQuestion({
      query: question.trim(),
      tender,
      analysis,
      conversationHistory: chat.messages.slice(-6)
    });

    // Append assistant response
    const assistantMessage = {
      role: 'assistant',
      content: ragResult.answer,
      citations: ragResult.citations || [],
      createdAt: new Date()
    };

    chat.messages.push(assistantMessage);
    await chat.save();

    logger.info(`Chat Q&A completed for tender ${tender._id}`);

    res.json({
      success: true,
      message: assistantMessage,
      chatHistory: chat.messages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/tenders/:id/chat
 * @desc    Get chat message history for tender
 * @access  Private
 */
const getChatHistory = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      tenderId: req.params.id,
      userId: req.user._id
    });

    res.json({
      success: true,
      messages: chat ? chat.messages : []
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/tenders/:id/chat
 * @desc    Clear chat message history for tender
 * @access  Private
 */
const clearChatHistory = async (req, res, next) => {
  try {
    await Chat.findOneAndDelete({
      tenderId: req.params.id,
      userId: req.user._id
    });

    res.json({
      success: true,
      message: 'Chat history cleared successfully',
      messages: []
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { askTenderChat, getChatHistory, clearChatHistory };
