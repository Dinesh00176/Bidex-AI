const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure disk storage with UUID sanitization
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeUUID = crypto.randomUUID();
    const timestamp = Date.now();
    cb(null, `doc_${timestamp}_${safeUUID}${ext}`);
  }
});

// Strictly validate PDF mime and extension
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  const isPdfMime = file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf';
  const isPdfExt = allowedExtensions.includes(ext);

  if (isPdfMime && isPdfExt) {
    return cb(null, true);
  } else {
    const error = new Error('Invalid file format. Only official PDF documents are accepted.');
    error.statusCode = 400;
    return cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max limit
  }
});

module.exports = upload;
