const express = require('express');
const router = express.Router();
const { getProfessions, createProfession, getCategories } = require('../controllers/userController');

router.get('/', getCategories);
router.get('/professions', getProfessions);
router.post('/professions', createProfession);

module.exports = router;