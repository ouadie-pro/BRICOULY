const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const { 
  applyToPost, 
  getPostApplications, 
  getMyApplications, 
  updateApplicationStatus,
  withdrawApplication 
} = require('../controllers/applicationController');

router.post('/', auth, applyToPost);
router.get('/my', auth, getMyApplications);
router.get('/post/:postId', auth, getPostApplications);
router.put('/status', auth, updateApplicationStatus);
router.delete('/:applicationId', auth, withdrawApplication);

module.exports = router;
