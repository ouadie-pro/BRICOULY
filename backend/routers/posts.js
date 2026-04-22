const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json([]);
});

router.post('/', (req, res) => {
  res.status(400).json({ error: 'Posts feature removed. Please use services and bookings.' });
});

router.post('/:id/like', (req, res) => {
  res.status(400).json({ error: 'Posts feature removed.' });
});

router.delete('/:id', (req, res) => {
  res.status(400).json({ error: 'Posts feature removed.' });
});

router.get('/:id/comments', (req, res) => {
  res.json([]);
});

router.post('/:id/comments', (req, res) => {
  res.status(400).json({ error: 'Posts feature removed.' });
});

module.exports = router;
