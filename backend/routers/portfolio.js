const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const { 
  getProviderPortfolio, 
  createPortfolio, 
  deletePortfolio, 
  uploadPortfolio 
} = require('../controllers/portfolioController');

router.get('/providers/:id/portfolio', getProviderPortfolio);
router.post('/', createPortfolio);
router.delete('/:id', deletePortfolio);
router.post('/upload', upload.single('image'), uploadPortfolio);

module.exports = router;