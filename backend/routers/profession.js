const express = require('express');
const router = express.Router();
const { getProfessions, createProfession } = require('../controllers/userController');

router.get('/', getProfessions);
router.post('/', createProfession);

module.exports = router;