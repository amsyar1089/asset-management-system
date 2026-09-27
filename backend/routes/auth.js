const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.isActive)
      return res.status(401).json({ message: 'Account has been deactivated' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/register (superuser only — or first-run)
router.post('/register', protect, async (req, res) => {
  try {
    if (req.user.role !== 'superuser')
      return res.status(403).json({ message: 'Only superuser can create accounts' });

    const { name, email, password, role, department } = req.body;
    const user = await User.create({ name, email, password, role, department });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ message: 'Email already exists' });
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

// POST /api/auth/seed — create first superuser (disable after use)
router.post('/seed', async (req, res) => {
  try {
    const count = await User.countDocuments();
    if (count > 0)
      return res.status(400).json({ message: 'Seed already done. Remove this route.' });

    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@examedia.com.my',
      password: 'Admin@1234',
      role: 'superuser',
      department: 'IT',
    });
    res.status(201).json({ message: 'Superuser created', email: admin.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
