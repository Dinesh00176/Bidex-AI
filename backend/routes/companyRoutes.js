const express = require('express');
const router = express.Router();
const {
  getCompanyProfile,
  updateCompanyProfile,
  uploadCompanyDocument,
  deleteCompanyDocument
} = require('../controllers/companyController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/', getCompanyProfile);
router.put('/', updateCompanyProfile);
router.post('/documents', upload.single('file'), uploadCompanyDocument);
router.delete('/documents/:docId', deleteCompanyDocument);

module.exports = router;
