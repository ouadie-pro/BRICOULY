const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json([]);
});

router.get('/users/:id/articles', (req, res) => {
  res.json([]);
});

router.post('/', (req, res) => {
  res.status(200).json({ success: true, articles: [] });
});

router.post('/:id/like', (req, res) => {
  res.status(400).json({ error: 'Articles feature removed.' });
});

router.delete('/:id', (req, res) => {
  res.status(400).json({ error: 'Articles feature removed.' });
});

router.get('/:id/comments', (req, res) => {
  res.json([]);
});

router.post('/:id/comments', (req, res) => {
  res.status(400).json({ error: 'Articles feature removed.' });
});

module.exports = router;
