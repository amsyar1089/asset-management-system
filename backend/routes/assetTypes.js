const express    = require('express');
const AssetType  = require('../models/AssetType');
const { protect, authorise } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const DEFAULTS = [
  'PC','Notebook','Printer','Scanner','Barcode Printer',
  'Server','Access Point (AP)','Monitor PACS','Barcode Reader','Switch','UPS','Other',
];

// Seed defaults on first call if collection is empty
async function ensureDefaults() {
  const count = await AssetType.countDocuments();
  if (count === 0) {
    await AssetType.insertMany(DEFAULTS.map(name => ({ name, isDefault: true })));
  }
}

// GET /api/asset-types
router.get('/', async (req, res) => {
  try {
    await ensureDefaults();
    const types = await AssetType.find().sort({ isDefault: -1, name: 1 });
    res.json(types.map(t => t.name));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/asset-types — manager, superuser only
router.post('/', authorise('superuser', 'manager'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Type name is required' });
    const existing = await AssetType.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ message: 'Asset type already exists' });
    const t = await AssetType.create({ name: name.trim(), createdBy: req.user._id });
    res.status(201).json(t.name);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/asset-types/:name — superuser only, cannot delete defaults
router.delete('/:name', authorise('superuser'), async (req, res) => {
  try {
    const t = await AssetType.findOne({ name: decodeURIComponent(req.params.name) });
    if (!t) return res.status(404).json({ message: 'Type not found' });
    if (t.isDefault) return res.status(400).json({ message: 'Cannot delete a default asset type' });
    await t.deleteOne();
    res.json({ message: 'Asset type deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
