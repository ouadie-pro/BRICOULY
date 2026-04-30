const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/upload');
const { 
  getProviderPortfolio, 
  createPortfolio, 
  deletePortfolio, 
  uploadPortfolio 
} = require('../controllers/portfolioController');

router.get('/:providerId', getProviderPortfolio);
router.post('/', auth, createPortfolio);
router.delete('/:id', auth, deletePortfolio);
router.post('/upload', auth, upload.single('image'), uploadPortfolio);

module.exports = router;
