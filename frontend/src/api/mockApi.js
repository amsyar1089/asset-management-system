// ─── Mock Data — realistic HRPB asset data ────────────────────────────────

// Demo users
const USERS = [
  { _id: 'u1', name: 'Ahmad Safwan',   email: 'admin@examedia.com.my',    role: 'superuser', department: 'IT', isActive: true, lastLogin: new Date().toISOString() },
  { _id: 'u2', name: 'Razif Hakim',    email: 'manager@examedia.com.my',  role: 'manager',   department: 'IT', isActive: true, lastLogin: new Date().toISOString() },
  { _id: 'u3', name: 'Faizal Nizam',   email: 'engineer@examedia.com.my', role: 'engineer',  department: 'IT', isActive: true, lastLogin: null },
  { _id: 'u4', name: 'Nurul Hidayah',  email: 'hidayah@examedia.com.my',  role: 'engineer',  department: 'IT', isActive: false, lastLogin: null },
]

// Demo assets — matching the Excel columns exactly
const ASSETS_RAW = [
  { no:1,  serialNumber:'PC0S3A70',   assetType:'PC',       location:'WAD 1A', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-22', remarks:'OK' },
  { no:2,  serialNumber:'PC0S3A71',   assetType:'PC',       location:'WAD 1A', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-22', remarks:'OK' },
  { no:3,  serialNumber:'PC0S3A72',   assetType:'PC',       location:'WAD 1A', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-22', remarks:'OK' },
  { no:4,  serialNumber:'PC0S3A73',   assetType:'PC',       location:'WAD 1A', subLocation:'BILIK LASER',     building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-22', remarks:'OK' },
  { no:5,  serialNumber:'PC0S3A74',   assetType:'PC',       location:'WAD 1A', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-22', remarks:'OK' },
  { no:6,  serialNumber:'PC0S3A75',   assetType:'PC',       location:'WAD 1A', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-22', remarks:'OK' },
  { no:7,  serialNumber:'PC0S3A76',   assetType:'PC',       location:'WAD 1A', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-22', remarks:'OK' },
  { no:8,  serialNumber:'PC0S3WBP',   assetType:'PC',       location:'WAD 1A', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-22', remarks:'OK' },
  { no:9,  serialNumber:'4CE348CVK8', assetType:'PC',       location:'WAD 1A', subLocation:'KAUNTER',         building:'MB', model:'HP ELITE 800 G9 TOWER BUSINESS PC',  dateTagged:'2026-02-10', remarks:'OK' },
  { no:10, serialNumber:'4CE348CVK9', assetType:'PC',       location:'WAD 1A', subLocation:'KAUNTER',         building:'MB', model:'HP ELITE 800 G9 TOWER BUSINESS PC',  dateTagged:'2026-02-11', remarks:'OK' },
  { no:11, serialNumber:'PC0S3A3S',   assetType:'PC',       location:'WAD 1B', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-22', remarks:'OK' },
  { no:12, serialNumber:'PC0S3A7C',   assetType:'PC',       location:'WAD 1B', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-22', remarks:'OK' },
  { no:13, serialNumber:'PC0S3A7D',   assetType:'PC',       location:'WAD 1B', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-22', remarks:'OK' },
  { no:14, serialNumber:'PC0S3ABN',   assetType:'PC',       location:'WAD 1B', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-22', remarks:'OK' },
  { no:15, serialNumber:'PC0S3WAP',   assetType:'PC',       location:'WAD 1B', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-22', remarks:'OK' },
  { no:16, serialNumber:'PC0S3WFU',   assetType:'PC',       location:'WAD 1B', subLocation:'BILIK SISTER',    building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-22', remarks:'OK' },
  { no:17, serialNumber:'PC0S2BWT',   assetType:'PC',       location:'WAD 1B', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-22', remarks:'OK' },
  { no:18, serialNumber:'4CE348CVK8', assetType:'PC',       location:'WAD 1B', subLocation:'UNIT HEMATOLOGI', building:'MB', model:'HP ELITE 800 G9 TOWER BUSINESS PC',  dateTagged:'2026-02-11', remarks:'OK' },
  { no:19, serialNumber:'PC0S3A86',   assetType:'PC',       location:'WAD 1C', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-23', remarks:'OK' },
  { no:20, serialNumber:'PC0S3WA0',   assetType:'PC',       location:'WAD 1C', subLocation:'BILIK SISTER',    building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-23', remarks:'OK' },
  { no:21, serialNumber:'PC0S3WFB',   assetType:'PC',       location:'WAD 1C', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-23', remarks:'OK' },
  { no:22, serialNumber:'4CE348CVKC', assetType:'PC',       location:'WAD 1C', subLocation:'KAUNTER DEPAN',   building:'MB', model:'HP ZZ TOWER WORKSTATION',             dateTagged:'2026-02-11', remarks:'OK' },
  { no:23, serialNumber:'PC0GKYKH',   assetType:'PC',       location:'WAD 1C', subLocation:'BILIK MATRON',    building:'MB', model:'LENOVO THINKCENTRE M700Z AIO',        dateTagged:'2025-12-23', remarks:'Missing' },
  { no:24, serialNumber:'SGH711T8L1', assetType:'PC',       location:'WAD 1C', subLocation:'KAUNTER',         building:'MB', model:'HP Z240 SFF WORKSTATION',             dateTagged:'2025-12-23', remarks:'Missing' },
  { no:25, serialNumber:'PC0S3A7L',   assetType:'PC',       location:'WAD 1D', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-23', remarks:'OK' },
  { no:26, serialNumber:'PC0S3A7N',   assetType:'PC',       location:'WAD 1D', subLocation:'KAUNTER',         building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-23', remarks:'OK' },
  { no:27, serialNumber:'PC0S3A7P',   assetType:'PC',       location:'WAD 1D', subLocation:'BILIK SISTER',    building:'MB', model:'LENOVO THINKCENTRE M710T',           dateTagged:'2025-12-23', remarks:'OK' },
  { no:28, serialNumber:'NB001HRPB',  assetType:'Notebook', location:'FARMASI', subLocation:'KAUNTER',        building:'MB', model:'DELL LATITUDE 5420',                  dateTagged:'2025-11-01', remarks:'OK' },
  { no:29, serialNumber:'NB002HRPB',  assetType:'Notebook', location:'ICU',     subLocation:'NURSES STATION', building:'MB', model:'HP ELITEBOOK 840 G8',                 dateTagged:'2025-11-15', remarks:'OK' },
  { no:30, serialNumber:'PR001HRPB',  assetType:'Printer',  location:'WAD 2A',  subLocation:'KAUNTER',        building:'MB', model:'HP LASERJET PRO M404DN',              dateTagged:'2025-10-10', remarks:'Under Maintenance' },
  { no:31, serialNumber:'SC001HRPB',  assetType:'Scanner',  location:'OPD',     subLocation:'RECEPTION',      building:'OPD', model:'FUJITSU FI-7160',                    dateTagged:'2025-09-01', remarks:'OK' },
  { no:32, serialNumber:'BC001HRPB',  assetType:'Barcode Printer',  location:'STOR', subLocation:'MAIN STORE', building:'MB', model:'ZEBRA ZT230',                        dateTagged:'2025-08-20', remarks:'OK' },
  { no:33, serialNumber:'SRV001HRPB', assetType:'Server',   location:'SERVER ROOM', subLocation:'RACK A',     building:'MB', model:'DELL POWEREDGE R750',                 dateTagged:'2024-06-01', remarks:'OK' },
  { no:34, serialNumber:'AP001HRPB',  assetType:'Access Point (AP)', location:'WAD 3A', subLocation:'CORRIDOR', building:'MB', model:'CISCO AIRONET 2802I',               dateTagged:'2024-12-01', remarks:'OK' },
  { no:35, serialNumber:'MP001HRPB',  assetType:'Monitor PACS', location:'RADIOLOGY', subLocation:'VIEWING ROOM', building:'MB', model:'BARCO MDRC-3120',               dateTagged:'2023-03-15', remarks:'OK' },
  { no:36, serialNumber:'BSC001HRPB', assetType:'Barcode Reader', location:'PHARMACY', subLocation:'DISPENSING', building:'MB', model:'HONEYWELL XENON 1900',           dateTagged:'2025-07-10', remarks:'Faulty' },
]

// Add IDs and timestamps to assets
let ASSETS = ASSETS_RAW.map((a, i) => ({
  ...a,
  _id: `asset_${i + 1}`,
  assignedTo: '',
  ipAddress: '',
  notes: '',
  createdBy: { _id: 'u1', name: 'Ahmad Safwan' },
  updatedBy: null,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
}))

// ─── Mock Auth ────────────────────────────────────────────────────────────────
export const mockLogin = async (email, password) => {
  await delay()
  const user = USERS.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (!user) throw { response: { data: { message: 'Invalid email or password' } } }
  if (!user.isActive) throw { response: { data: { message: 'Account has been deactivated' } } }
  const token = 'demo_token_' + user._id
  return { data: { token, user } }
}

export const mockGetMe = async () => {
  await delay(100)
  const stored = localStorage.getItem('ams_user')
  return { data: stored ? JSON.parse(stored) : null }
}

// ─── Mock Assets ──────────────────────────────────────────────────────────────
export const mockGetAssets = async (params = {}) => {
  await delay()
  const { search = '', assetType = '', remarks = '', location = '',
          sortBy = 'no', sortOrder = 'asc', page = 1, limit = 20 } = params

  let filtered = [...ASSETS]

  if (search) {
    const s = search.toLowerCase()
    filtered = filtered.filter(a =>
      a.serialNumber.toLowerCase().includes(s) ||
      a.model.toLowerCase().includes(s) ||
      a.location.toLowerCase().includes(s) ||
      a.subLocation.toLowerCase().includes(s)
    )
  }
  if (assetType) filtered = filtered.filter(a => a.assetType === assetType)
  if (remarks)   filtered = filtered.filter(a => a.remarks   === remarks)
  if (location)  filtered = filtered.filter(a => a.location.toLowerCase().includes(location.toLowerCase()))

  filtered.sort((a, b) => {
    const av = a[sortBy], bv = b[sortBy]
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv))
    return sortOrder === 'desc' ? -cmp : cmp
  })

  const total = filtered.length
  const start = (Number(page) - 1) * Number(limit)
  const assets = filtered.slice(start, start + Number(limit))

  return { data: { assets, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } }
}

export const mockGetAssetStats = async () => {
  await delay()
  const total       = ASSETS.length
  const ok          = ASSETS.filter(a => a.remarks === 'OK').length
  const missing     = ASSETS.filter(a => a.remarks === 'Missing').length
  const maintenance = ASSETS.filter(a => a.remarks === 'Under Maintenance').length
  const disposed    = ASSETS.filter(a => a.remarks === 'Disposed').length
  const faulty      = ASSETS.filter(a => a.remarks === 'Faulty').length

  const typeCount = {}
  ASSETS.forEach(a => { typeCount[a.assetType] = (typeCount[a.assetType] || 0) + 1 })
  const byType = Object.entries(typeCount).map(([_id, count]) => ({ _id, count })).sort((a,b) => b.count - a.count)

  const locCount = {}
  ASSETS.forEach(a => { locCount[a.location] = (locCount[a.location] || 0) + 1 })
  const byLocation = Object.entries(locCount).map(([_id, count]) => ({ _id, count })).sort((a,b) => b.count - a.count).slice(0,10)

  const recent = [...ASSETS].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  return { data: { total, ok, missing, maintenance, disposed, faulty, byType, byLocation, recent } }
}

export const mockGetAsset = async (id) => {
  await delay(200)
  const asset = ASSETS.find(a => a._id === id)
  if (!asset) throw { response: { data: { message: 'Asset not found' } } }
  return { data: asset }
}

export const mockCreateAsset = async (body) => {
  await delay()
  const user = JSON.parse(localStorage.getItem('ams_user') || '{}')
  const newAsset = {
    ...body,
    _id: 'asset_' + Date.now(),
    no: Math.max(...ASSETS.map(a => a.no)) + 1,
    createdBy: { _id: user._id, name: user.name },
    updatedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  ASSETS = [newAsset, ...ASSETS]
  mockLogActivity('created', user, newAsset)
  return { data: newAsset }
}

export const mockUpdateAsset = async (id, body) => {
  await delay()
  const idx = ASSETS.findIndex(a => a._id === id)
  if (idx === -1) throw { response: { data: { message: 'Asset not found' } } }
  const user = JSON.parse(localStorage.getItem('ams_user') || '{}')
  const old = ASSETS[idx]
  ASSETS[idx] = { ...old, ...body, updatedBy: { _id: user._id, name: user.name }, updatedAt: new Date().toISOString() }
  const changed = Object.keys(body).filter(k => String(old[k]) !== String(body[k])).map(k => `${k}: "${old[k]}" → "${body[k]}"`).join(', ')
  mockLogActivity('updated', user, ASSETS[idx], changed || 'No changes')
  return { data: ASSETS[idx] }
}

export const mockDeleteAsset = async (id) => {
  await delay()
  const idx = ASSETS.findIndex(a => a._id === id)
  if (idx === -1) throw { response: { data: { message: 'Asset not found' } } }
  const user = JSON.parse(localStorage.getItem('ams_user') || '{}')
  const asset = ASSETS[idx]
  ASSETS.splice(idx, 1)
  mockLogActivity('deleted', user, asset)
  return { data: { message: 'Asset deleted' } }
}

// ─── Mock Users ───────────────────────────────────────────────────────────────
let MOCK_USERS = [...USERS]

export const mockGetUsers = async () => {
  await delay()
  return { data: MOCK_USERS }
}

export const mockCreateUser = async (body) => {
  await delay()
  if (MOCK_USERS.find(u => u.email === body.email))
    throw { response: { data: { message: 'Email already exists' } } }
  const newUser = { ...body, _id: 'u_' + Date.now(), isActive: true, lastLogin: null }
  MOCK_USERS = [newUser, ...MOCK_USERS]
  return { data: newUser }
}

export const mockUpdateUser = async (id, body) => {
  await delay()
  const idx = MOCK_USERS.findIndex(u => u._id === id)
  if (idx === -1) throw { response: { data: { message: 'User not found' } } }
  MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...body }
  return { data: MOCK_USERS[idx] }
}

export const mockDeleteUser = async (id) => {
  await delay()
  MOCK_USERS = MOCK_USERS.filter(u => u._id !== id)
  return { data: { message: 'User deleted' } }
}

// ─── Mock Activity Log ────────────────────────────────────────────────────────
let LOGS = []

export const mockLogActivity = (action, user, asset, details = '') => {
  LOGS.unshift({
    _id: 'log_' + Date.now() + Math.random(),
    action,
    user: { _id: user._id, name: user.name, role: user.role },
    asset: { _id: asset._id, serialNumber: asset.serialNumber, assetType: asset.assetType, location: asset.location },
    details,
    createdAt: new Date().toISOString(),
  })
}

export const mockGetLogs = async ({ page = 1, limit = 50, action: filterAction } = {}) => {
  await delay()
  let filtered = LOGS
  if (filterAction) filtered = filtered.filter(l => l.action === filterAction)
  const total = filtered.length
  const start = (Number(page) - 1) * Number(limit)
  return {
    data: {
      logs: filtered.slice(start, start + Number(limit)),
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)) || 1,
    }
  }
}

// ─── Mock Asset Types ─────────────────────────────────────────────────────────
let ASSET_TYPES_MOCK = [
  'PC','Notebook','Printer','Scanner','Barcode Printer',
  'Server','Access Point (AP)','Monitor PACS','Barcode Reader','Switch','UPS','Other',
]

export const mockGetAssetTypes = async () => {
  await delay(100)
  return { data: ASSET_TYPES_MOCK }
}

export const mockAddAssetType = async (name) => {
  await delay()
  if (ASSET_TYPES_MOCK.includes(name)) throw { response: { data: { message: 'Asset type already exists' } } }
  ASSET_TYPES_MOCK = [...ASSET_TYPES_MOCK, name]
  return { data: name }
}

// ─── Mock Duplicate Detector ──────────────────────────────────────────────────
export const mockGetDuplicates = async () => {
  await delay(400)

  // 1. Exact: same serialNumber
  const serialMap = {}
  ASSETS.forEach(a => {
    if (!a.serialNumber) return
    if (!serialMap[a.serialNumber]) serialMap[a.serialNumber] = []
    serialMap[a.serialNumber].push(a)
  })
  const exact = Object.entries(serialMap)
    .filter(([, docs]) => docs.length > 1)
    .map(([serial, docs]) => ({ _id: serial, count: docs.length, docs }))
    .sort((a, b) => b.count - a.count)

  // 2. Potential: same model + location + subLocation (case-insensitive)
  const mlMap = {}
  ASSETS.forEach(a => {
    const key = `${(a.model||'').toUpperCase()}|${(a.location||'').toUpperCase()}|${(a.subLocation||'').toUpperCase()}`
    if (!mlMap[key]) mlMap[key] = { _id: { model: (a.model||'').toUpperCase(), location: (a.location||'').toUpperCase(), subLocation: (a.subLocation||'').toUpperCase() }, docs: [] }
    mlMap[key].docs.push(a)
  })
  const potential = Object.values(mlMap)
    .filter(g => g.docs.length > 1 && g._id.model)
    .map(g => ({ ...g, count: g.docs.length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50)

  return {
    data: {
      exact,
      potential,
      summary: {
        exactGroups:     exact.length,
        exactAssets:     exact.reduce((s, g) => s + g.count, 0),
        potentialGroups: potential.length,
        potentialAssets: potential.reduce((s, g) => s + g.count, 0),
      },
    }
  }
}

// ─── Mock Import ──────────────────────────────────────────────────────────────
export const mockImportAssets = async ({ assets }) => {
  await delay(800)
  let imported = 0, skipped = 0
  const skippedSerials = []
  const user = JSON.parse(localStorage.getItem('ams_user') || '{}')
  for (const row of assets) {
    const dup = ASSETS.find(a => a.serialNumber === row.serialNumber)
    if (dup) { skipped++; skippedSerials.push(row.serialNumber); continue }
    const newAsset = {
      ...row,
      _id: 'asset_' + Date.now() + Math.random(),
      no: Math.max(...ASSETS.map(a => a.no)) + 1,
      createdBy: { _id: user._id, name: user.name },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    ASSETS = [...ASSETS, newAsset]
    imported++
  }
  if (imported > 0) {
    const user2 = JSON.parse(localStorage.getItem('ams_user') || '{}')
    mockLogActivity('imported', user2, { _id: '', serialNumber: `${imported} assets`, assetType: assets[0]?.assetType || '' }, `Bulk imported ${imported} records`)
  }
  return {
    data: {
      imported, skipped, failed: 0, skippedSerials,
      message: `Import complete: ${imported} imported, ${skipped} skipped (duplicates)`,
    }
  }
}
