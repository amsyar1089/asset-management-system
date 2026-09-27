/**
 * One-time seed script — creates the first Superuser account.
 * Run: node seed.js
 * Delete or ignore this file after running.
 */

require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const MONGO_URI = process.env.MONGODB_URI
if (!MONGO_URI || MONGO_URI.includes('<db_password>')) {
  console.error('❌ MONGODB_URI in .env is missing or still has <db_password> placeholder.')
  process.exit(1)
}

// ── Inline User schema (so we don't need to import the model) ──
const userSchema = new mongoose.Schema({
  name:      String,
  email:     { type: String, unique: true },
  password:  String,
  role:      { type: String, default: 'superuser' },
  department:{ type: String, default: 'IT' },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true })

const User = mongoose.model('User', userSchema)

async function seed() {
  console.log('🔌 Connecting to MongoDB Atlas...')
  await mongoose.connect(MONGO_URI)
  console.log('✅ Connected!')

  const existing = await User.findOne({ role: 'superuser' })
  if (existing) {
    console.log(`ℹ️  Superuser already exists: ${existing.email}`)
    await mongoose.disconnect()
    return
  }

  const hashed = await bcrypt.hash('Admin@1234', 12)
  await User.create({
    name:     'Super Admin',
    email:    'admin@examedia.com.my',
    password: hashed,
    role:     'superuser',
    department: 'IT',
  })

  console.log('')
  console.log('✅ Superuser created successfully!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('   Email    : admin@examedia.com.my')
  console.log('   Password : Admin@1234')
  console.log('   Role     : superuser')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('⚠️  Please change the password after first login!')
  console.log('')

  await mongoose.disconnect()
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message)
  process.exit(1)
})
