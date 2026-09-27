const express      = require('express');
const Asset        = require('../models/Asset');
const ActivityLog  = require('../models/ActivityLog');
const { protect, authorise } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// Helper — fire-and-forget activity log
const log = (action, req, asset, details = '') => {
  ActivityLog.create({
    action,
    user: { _id: req.user._id, name: req.user.name, role: req.user.role },
    asset: {
      _id:          asset._id,
      serialNumber: asset.serialNumber,
      assetType:    asset.assetType,
      location:     asset.location,
    },
    details,
  }).catch(() => {}); // non-blocking
};

// GET /api/assets/duplicates — find exact & potential duplicate assets
router.get('/duplicates', async (req, res) => {
  try {
    // 1. Exact duplicates — same serial number (shouldn't happen due to unique index, but covers import edge cases)
    const exactRaw = await Asset.aggregate([
      { $group: {
          _id: '$serialNumber',
          count: { $sum: 1 },
          docs: { $push: {
            _id: '$_id', serialNumber: '$serialNumber', assetType: '$assetType',
            location: '$location', subLocation: '$subLocation', building: '$building',
            model: '$model', dateTagged: '$dateTagged', remarks: '$remarks', createdAt: '$createdAt',
          }},
      }},
      { $match: { count: { $gt: 1 } } },
      { $sort:  { count: -1 } },
    ]);

    // 2. Potential duplicates — same model + location + subLocation (different serial, may be same physical device)
    const potentialRaw = await Asset.aggregate([
      { $group: {
          _id: {
            model:       { $toUpper: '$model' },
            location:    { $toUpper: '$location' },
            subLocation: { $toUpper: '$subLocation' },
          },
          count: { $sum: 1 },
          docs: { $push: {
            _id: '$_id', serialNumber: '$serialNumber', assetType: '$assetType',
            location: '$location', subLocation: '$subLocation', building: '$building',
            model: '$model', dateTagged: '$dateTagged', remarks: '$remarks', createdAt: '$createdAt',
          }},
      }},
      { $match: { count: { $gt: 1 }, '_id.model': { $ne: '' } } },
      { $sort:  { count: -1 } },
      { $limit: 50 },
    ]);

    res.json({
      exact:     exactRaw,
      potential: potentialRaw,
      summary: {
        exactGroups:     exactRaw.length,
        exactAssets:     exactRaw.reduce((s, g) => s + g.count, 0),
        potentialGroups: potentialRaw.length,
        potentialAssets: potentialRaw.reduce((s, g) => s + g.count, 0),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/assets/stats — dashboard summary
router.get('/stats', async (req, res) => {
  try {
    const total       = await Asset.countDocuments();
    const ok          = await Asset.countDocuments({ remarks: 'OK' });
    const missing     = await Asset.countDocuments({ remarks: 'Missing' });
    const maintenance = await Asset.countDocuments({ remarks: 'Under Maintenance' });
    const disposed    = await Asset.countDocuments({ remarks: 'Disposed' });
    const faulty      = await Asset.countDocuments({ remarks: 'Faulty' });
    const belumSign   = await Asset.countDocuments({ remarks: 'Belum Sign' });

    // Count by asset type
    const byType = await Asset.aggregate([
      { $group: { _id: '$assetType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Count by location
    const byLocation = await Asset.aggregate([
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Recent 5 assets
    const recent = await Asset.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'name');

    res.json({ total, ok, missing, maintenance, disposed, faulty, belumSign, byType, byLocation, recent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/assets — list with search, filter, pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1, limit = 20,
      search, assetType, location, remarks, building,
      sortBy = 'no', sortOrder = 'asc',
    } = req.query;

    const filter = {};
    if (assetType)  filter.assetType = assetType;
    if (location)   filter.location  = { $regex: location, $options: 'i' };
    if (remarks)    filter.remarks   = remarks;
    if (building)   filter.building  = { $regex: building, $options: 'i' };
    if (search) {
      filter.$or = [
        { serialNumber: { $regex: search, $options: 'i' } },
        { model:        { $regex: search, $options: 'i' } },
        { location:     { $regex: search, $options: 'i' } },
        { subLocation:  { $regex: search, $options: 'i' } },
        { assignedTo:   { $regex: search, $options: 'i' } },
      ];
    }

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [assets, total] = await Promise.all([
      Asset.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('createdBy', 'name')
        .populate('updatedBy', 'name'),
      Asset.countDocuments(filter),
    ]);

    res.json({
      assets,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/assets/:id
router.get('/:id', async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/assets — engineer, manager, superuser
router.post('/', authorise('superuser', 'manager', 'engineer'), async (req, res) => {
  try {
    // Normalize serialNumber: trim whitespace & force uppercase before saving/checking
    const body = { ...req.body };
    if (body.serialNumber) {
      body.serialNumber = String(body.serialNumber).trim().toUpperCase();
    }

    // Pre-check: does this serial number already exist? (gives a clearer error message)
    const existing = await Asset.findOne({ serialNumber: body.serialNumber });
    if (existing) {
      return res.status(400).json({
        message: `Serial number already exists`,
        existingId: existing._id,
        existingLocation: existing.location,
        existingType: existing.assetType,
      });
    }

    const asset = await Asset.create({ ...body, createdBy: req.user._id });
    log('created', req, asset);
    res.status(201).json(asset);
  } catch (err) {
    if (err.code === 11000) {
      // Distinguish: is it serialNumber or the auto-increment 'no' field?
      const isSerialDup = err.keyPattern?.serialNumber || err.keyValue?.serialNumber;
      return res.status(400).json({
        message: isSerialDup ? 'Serial number already exists' : 'Failed to save asset (auto-number conflict, please try again)',
      });
    }
    res.status(400).json({ message: err.message });
  }
});

// POST /api/assets/import — bulk import from Excel (only serialNumber required)
router.post('/import', authorise('superuser', 'manager', 'engineer'), async (req, res) => {
  try {
    const { assets } = req.body;
    if (!Array.isArray(assets) || assets.length === 0)
      return res.status(400).json({ message: 'No assets provided' });

    // Only requirement: must have a serial number (even if everything else is empty)
    const toInsert = assets
      .filter(a => a.serialNumber && String(a.serialNumber).trim() !== '')
      .map(a => ({
        ...a,
        // Ensure serialNumber is always a clean uppercase string
        // (Excel sometimes stores serial numbers as numbers e.g. 12345)
        serialNumber: String(a.serialNumber).trim().toUpperCase(),
        // Safe string defaults for other fields — all optional now
        assetType:   String(a.assetType   || '').trim(),
        location:    String(a.location    || '').trim().toUpperCase(),
        subLocation: String(a.subLocation || '').trim().toUpperCase(),
        building:    String(a.building    || 'MB').trim().toUpperCase(),
        model:       String(a.model       || '').trim().toUpperCase(),
        remarks:     a.remarks || 'OK',
        createdBy:   req.user._id,
      }));

    let imported = 0, failed = 0;
    const writeErrors = [];

    if (toInsert.length > 0) {
      try {
        // ordered:false — continues on individual doc failure
        const result = await Asset.insertMany(toInsert, { ordered: false });
        imported = result.length;
      } catch (bulkErr) {
        // BulkWriteError: partial inserts still happened
        if (bulkErr.result) {
          imported = bulkErr.result.nInserted || 0;
          writeErrors.push(...(bulkErr.writeErrors || []));
        } else {
          throw bulkErr;
        }
      }
    }

    failed = toInsert.length - imported;

    // Log as bulk import
    if (imported > 0) {
      ActivityLog.create({
        action: 'imported',
        user: { _id: req.user._id, name: req.user.name, role: req.user.role },
        asset: { serialNumber: '(bulk)', assetType: assets[0]?.assetType || '', location: '' },
        details: `Bulk import: ${imported} assets inserted`,
        count: imported,
      }).catch(() => {});
    }

    res.status(201).json({
      message: `Import complete: ${imported} imported, ${failed} failed`,
      imported,
      skipped: 0,
      failed,
      errors: writeErrors.slice(0, 20).map(e => ({
        serial: e.getOperation?.()?.serialNumber || '',
        error: e.errmsg || e.message || 'Unknown error',
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// PUT /api/assets/:id — engineer can edit location of any asset; full edit for own assets; manager & superuser edit all
router.put('/:id', authorise('superuser', 'manager', 'engineer'), async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const isOwner = asset.createdBy?.toString() === req.user._id.toString();
    const isEngineer = req.user.role === 'engineer';

    // Engineers who did NOT create the asset can only update location fields
    const LOCATION_FIELDS = ['location', 'subLocation', 'building'];
    let updateData = { ...req.body };

    if (isEngineer && !isOwner) {
      // Strip everything except location fields
      updateData = {};
      LOCATION_FIELDS.forEach(field => {
        if (req.body[field] !== undefined) updateData[field] = req.body[field];
      });
    }

    const updated = await Asset.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updatedBy: req.user._id },
      { new: true, runValidators: true }
    );

    // Build change summary
    const changed = Object.keys(updateData)
      .filter(k => String(asset[k]) !== String(updateData[k]))
      .map(k => `${k}: "${asset[k]}" → "${updateData[k]}"`)
      .join(', ');
    log('updated', req, updated, changed || 'No changes');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/assets/all — clear ALL assets (superuser & manager only)
router.delete('/all', authorise('superuser', 'manager'), async (req, res) => {
  try {
    const { deletedCount } = await Asset.deleteMany({});
    // Log the wipe
    ActivityLog.create({
      action: 'deleted',
      user: { _id: req.user._id, name: req.user.name, role: req.user.role },
      asset: { serialNumber: '(ALL)', assetType: '', location: '' },
      details: `Cleared entire asset database — ${deletedCount} assets removed`,
      count: deletedCount,
    }).catch(() => {});
    res.json({ message: `All assets cleared — ${deletedCount} records deleted`, deletedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/assets/:id — superuser & manager only
router.delete('/:id', authorise('superuser', 'manager'), async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    log('deleted', req, asset);
    res.json({ message: 'Asset deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
