const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.get('/', protect, (req, res) => {
  res.status(501).json({ status: 'info', message: 'Get notifications - Phase 6' });
});

router.put('/:id/read', protect, (req, res) => {
  res.status(501).json({ status: 'info', message: 'Mark notification as read - Phase 6' });
});

router.put('/preferences', protect, (req, res) => {
  res.status(501).json({ status: 'info', message: 'Update notification preferences - Phase 6' });
});

module.exports = router;
