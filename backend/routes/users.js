const express = require('express');
const User = require('../models/User');
const { protect, authorise } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/users — superuser only
router.get('/', authorise('superuser'), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users — superuser only
router.post('/', authorise('superuser'), async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    const user = await User.create({ name, email, password, role, department });
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, department: user.department, isActive: user.isActive,
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: 'Email already exists' });
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/users/:id — superuser only
router.put('/:id', authorise('superuser'), async (req, res) => {
  try {
    const { name, email, role, department, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department, isActive },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/users/:id — superuser only (cannot delete self)
router.delete('/:id', authorise('superuser'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot delete your own account' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id/password — change own password or superuser resets
router.put('/:id/password', async (req, res) => {
  try {
    const isSelf = req.params.id === req.user._id.toString();
    if (!isSelf && req.user.role !== 'superuser')
      return res.status(403).json({ message: 'Not authorised' });

    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = req.body.password;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
