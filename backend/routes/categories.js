const express = require('express');
const router = express.Router();
const { getCategories, getCategory, createCategory, seedCategories } = require('../controllers/categoryController');

router.get('/', getCategories);
router.get('/:id', getCategory);
router.post('/', createCategory);
router.post('/seed', seedCategories);

module.exports = router;
