const express  = require('express');
const ActivityLog = require('../models/ActivityLog');
const { protect, authorise } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/logs — paginated activity log (manager + superuser)
router.get('/', authorise('superuser', 'manager'), async (req, res) => {
  try {
    const {
      page = 1, limit = 50,
      action, userId,
    } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (userId) filter['user._id'] = userId;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/logs/asset/:assetId — history for a single asset (all logged-in users)
router.get('/asset/:assetId', async (req, res) => {
  try {
    const logs = await ActivityLog.find({ 'asset._id': req.params.assetId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/logs — clear ALL activity logs (superuser only)
router.delete('/', authorise('superuser'), async (req, res) => {
  try {
    const { deletedCount } = await ActivityLog.deleteMany({});
    res.json({
      message: `Activity log cleared — ${deletedCount} records deleted`,
      deletedCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

