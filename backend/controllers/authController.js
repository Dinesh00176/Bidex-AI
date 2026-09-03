const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const logger = require('../utils/logger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'bidwise_enterprise_secure_jwt_secret_key_2026_x99!', {
    expiresIn: '7d'
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user & initialize default company profile
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, companyName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password
    });

    // Create linked default company profile
    const company = await Company.create({
      userId: user._id,
      companyName: companyName || `${name}'s Enterprises`,
      industry: 'Information Technology & Infrastructure',
      yearsExperience: 7,
      annualTurnover: 65000000,
      currency: 'INR',
      employeeCount: 45,
      certifications: ['ISO 9001:2015', 'ISO 27001:2013'],
      technicalSkills: ['Cloud Architecture', 'IoT Telemetry', 'Cybersecurity', 'Microservices', 'DevOps'],
      services: ['System Integration', 'Managed Cloud Services', 'Smart Infrastructure Solutions']
    });

    user.companyId = company._id;
    await user.save();

    const token = generateToken(user._id);

    logger.info(`User registered successfully: ${user.email}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: company._id,
        companyName: company.companyName
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email and password.'
      });
    }

    const company = await Company.findOne({ userId: user._id });
    const token = generateToken(user._id);

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: company ? company._id : null,
        companyName: company ? company.companyName : ''
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    const company = await Company.findOne({ userId: req.user._id });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: company ? company._id : null,
        companyName: company ? company.companyName : ''
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, loginUser, getMe };
