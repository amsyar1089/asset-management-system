import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { mockGetAsset, mockCreateAsset, mockUpdateAsset, mockGetAssetTypes, mockAddAssetType } from '../api/mockApi'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import './Dashboard.css'
import './AssetForm.css'
import './Logs.css'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

const DEFAULT_TYPES = ['PC','Notebook','Printer','Scanner','Barcode Printer','Server','Access Point (AP)','Monitor PACS','Barcode Reader','Switch','UPS','Other']
const REMARKS_LIST  = ['OK','Missing','Under Maintenance','Disposed','Faulty','Belum Sign']
const BUILDINGS     = ['ACC', 'KWKK', 'MB']

const EMPTY = {
  serialNumber:'', assetType:'PC', location:'', subLocation:'',
  building:'MB', model:'', dateTagged:'', remarks:'OK',
  purchaseDate:'', warrantyExpiry:'', assignedTo:'', ipAddress:'', notes:'',
}

const ACTION_META = {
  created:  { label: 'Created',  color: '#10b981', icon: '✨' },
  updated:  { label: 'Updated',  color: '#6366f1', icon: '✏️' },
  deleted:  { label: 'Deleted',  color: '#ef4444', icon: '🗑' },
  imported: { label: 'Imported', color: '#f59e0b', icon: '📥' },
}
const ROLE_COLORS = { superuser: '#ce182a', manager: '#f59e0b', engineer: '#3b82f6' }

export default function AssetForm({ viewOnly }) {
  const { id } = useParams()
  const isEdit  = Boolean(id)
  const navigate = useNavigate()
  const { can, user } = useAuth()

  // Track if this asset was created by current user
  const [assetOwnerId, setAssetOwnerId] = useState(null)

  // Engineer editing someone else's asset → can only edit location fields
  const isEngineer = user?.role === 'engineer'
  const isOwner    = !assetOwnerId || assetOwnerId === user?._id
  const isEngineerLocationOnly = isEdit && isEngineer && !isOwner && !viewOnly

  const [form, setForm]                     = useState(EMPTY)
  const [loading, setLoading]               = useState(isEdit)
  const [saving, setSaving]                 = useState(false)
  const [error, setError]                   = useState('')
  const [duplicateLink, setDuplicateLink]   = useState(null)
  const [assetTypes, setAssetTypes]         = useState(DEFAULT_TYPES)
  const [addingType, setAddingType]         = useState(false)
  const [newType, setNewType]               = useState('')
  const [savingType, setSavingType]         = useState(false)
  const [history, setHistory]               = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Load asset types
  useEffect(() => {
    const load = DEMO ? mockGetAssetTypes : () => api.get('/asset-types')
    load().then(({ data }) => setAssetTypes(data)).catch(() => {})
  }, [])

  // Load asset for edit/view
  useEffect(() => {
    if (!isEdit) return
    const fetch = DEMO ? () => mockGetAsset(id) : () => api.get(`/assets/${id}`)
    fetch()
      .then(({ data }) => {
        const d = { ...EMPTY, ...data }
        ;['dateTagged','purchaseDate','warrantyExpiry'].forEach(k => {
          if (d[k]) d[k] = new Date(d[k]).toISOString().slice(0,10)
        })
        setForm(d)
        // Track who created this asset
        setAssetOwnerId(data.createdBy?._id || data.createdBy || null)
      })
      .catch(() => setError('Failed to load asset'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  // Load history for existing assets
  useEffect(() => {
    if (!isEdit || DEMO) return
    setHistoryLoading(true)
    api.get(`/logs/asset/${id}`)
      .then(({ data }) => setHistory(data))
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'assetType' && value === '__add_new__') { setAddingType(true); return }
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleAddType = async () => {
    const trimmed = newType.trim()
    if (!trimmed) return
    setSavingType(true)
    try {
      const { data } = DEMO
        ? await mockAddAssetType(trimmed)
        : await api.post('/asset-types', { name: trimmed })
      setAssetTypes(prev => [...prev, data])
      setForm(f => ({ ...f, assetType: data }))
      setAddingType(false)
      setNewType('')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add type')
    } finally {
      setSavingType(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setDuplicateLink(null)
    setSaving(true)
    try {
      if (isEdit) {
        DEMO ? await mockUpdateAsset(id, form) : await api.put(`/assets/${id}`, form)
      } else {
        DEMO ? await mockCreateAsset(form) : await api.post('/assets', form)
      }
      navigate('/assets')
    } catch (err) {
      const data = err.response?.data
      if (data?.existingId) {
        setError(
          `Serial number already exists at location "${data.existingLocation || '—'}" (${data.existingType || '—'}).`
        )
        setDuplicateLink(data.existingId)
      } else {
        setError(data?.message || 'Failed to save asset')
      }
    } finally {
      setSaving(false)
    }
  }

  const fmt = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('en-MY', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) return <Layout><div className="loading-state">Loading…</div></Layout>

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isEdit ? (viewOnly ? 'View Asset' : 'Edit Asset') : 'Add New Asset'}
          </h1>
          <p className="page-sub">HRPB — Examedia Asset Management</p>
          {isEngineerLocationOnly && (
            <p style={{ marginTop: 6, fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>
              ⚠️ You can only update the Location fields for this asset.
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {viewOnly && can('edit') && (
            <button className="btn-primary" onClick={() => navigate(`/assets/${id}/edit`)}>
              ✏️ Edit Asset
            </button>
          )}
          <button className="btn-secondary" onClick={() => navigate('/assets')}>← Back to Assets</button>
        </div>
      </div>

      <form className="asset-form-card" onSubmit={handleSubmit}>
        {error && (
          <div className="form-error">
            {error}
            {duplicateLink && (
              <span>
                {' '}—{' '}
                <a href={`/assets/${duplicateLink}`} style={{ color: '#ef4444', fontWeight: 700, textDecoration: 'underline' }}
                  onClick={e => { e.preventDefault(); navigate(`/assets/${duplicateLink}`) }}>
                  View existing asset →
                </a>
              </span>
            )}
          </div>
        )}

        {/* Basic Information */}
        <div className="form-section" style={isEngineerLocationOnly ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
          <h3 className="section-title">📋 Basic Information
            {isEngineerLocationOnly && <span style={{ fontSize: 11, marginLeft: 8, color: '#f59e0b', fontWeight: 600 }}>🔒 Read-only</span>}
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Serial Number *</label>
              <input name="serialNumber" value={form.serialNumber} onChange={handleChange}
                required placeholder="e.g. PC0S3A70" className="form-input" readOnly={viewOnly || isEngineerLocationOnly} />
            </div>

            <div className="form-group">
              <label>Asset Type *</label>
              {addingType ? (
                <div className="type-add-row">
                  <input className="type-add-input" value={newType} onChange={e => setNewType(e.target.value)}
                    placeholder="e.g. UPS, Switch, CCTV…" autoFocus
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddType())} />
                  <button type="button" className="type-add-btn" onClick={handleAddType} disabled={savingType}>
                    {savingType ? '…' : '✓ Add'}
                  </button>
                  <button type="button" className="type-cancel-btn" onClick={() => { setAddingType(false); setNewType('') }}>✕</button>
                </div>
              ) : (
                <select name="assetType" value={form.assetType} onChange={handleChange}
                  required className="form-input" disabled={viewOnly || isEngineerLocationOnly}>
                  {assetTypes.map(t => <option key={t}>{t}</option>)}
                  {can('create') && !viewOnly && !isEngineerLocationOnly && <option value="__add_new__">＋ Add new type…</option>}
                </select>
              )}
            </div>

            <div className="form-group form-full">
              <label>Model *</label>
              <input name="model" value={form.model} onChange={handleChange}
                required placeholder="e.g. LENOVO THINKCENTRE M710T" className="form-input" readOnly={viewOnly || isEngineerLocationOnly} />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="form-section">
          <h3 className="section-title">📍 Location
            {isEngineerLocationOnly && <span style={{ fontSize: 11, marginLeft: 8, color: '#10b981', fontWeight: 600 }}>✏️ Editable</span>}
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Location *</label>
              <input name="location" value={form.location} onChange={handleChange}
                required placeholder="e.g. WAD 1A" className="form-input" readOnly={viewOnly} />
            </div>
            <div className="form-group">
              <label>Sub Location</label>
              <input name="subLocation" value={form.subLocation} onChange={handleChange}
                placeholder="e.g. KAUNTER, BILIK SISTER" className="form-input" readOnly={viewOnly} />
            </div>
            <div className="form-group">
              <label>Building</label>
              <select name="building" value={form.building} onChange={handleChange}
                className="form-input" disabled={viewOnly}>
                {BUILDINGS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Dates & Status */}
        <div className="form-section" style={isEngineerLocationOnly ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
          <h3 className="section-title">📅 Dates &amp; Status
            {isEngineerLocationOnly && <span style={{ fontSize: 11, marginLeft: 8, color: '#f59e0b', fontWeight: 600 }}>🔒 Read-only</span>}
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Date Tagged</label>
              <input type="date" name="dateTagged" value={form.dateTagged} onChange={handleChange}
                className="form-input" readOnly={viewOnly || isEngineerLocationOnly} />
            </div>
            <div className="form-group">
              <label>Purchase Date</label>
              <input type="date" name="purchaseDate" value={form.purchaseDate} onChange={handleChange}
                className="form-input" readOnly={viewOnly || isEngineerLocationOnly} />
            </div>
            <div className="form-group">
              <label>Warranty Expiry</label>
              <input type="date" name="warrantyExpiry" value={form.warrantyExpiry} onChange={handleChange}
                className="form-input" readOnly={viewOnly || isEngineerLocationOnly} />
            </div>
            <div className="form-group">
              <label>Remarks / Status *</label>
              <select name="remarks" value={form.remarks} onChange={handleChange}
                required className="form-input" disabled={viewOnly || isEngineerLocationOnly}>
                {REMARKS_LIST.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Additional Details */}
        <div className="form-section" style={isEngineerLocationOnly ? { opacity: 0.5, pointerEvents: 'none' } : {}}>
          <h3 className="section-title">ℹ️ Additional Details
            {isEngineerLocationOnly && <span style={{ fontSize: 11, marginLeft: 8, color: '#f59e0b', fontWeight: 600 }}>🔒 Read-only</span>}
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Assigned To</label>
              <input name="assignedTo" value={form.assignedTo} onChange={handleChange}
                placeholder="Name / Department" className="form-input" readOnly={viewOnly} />
            </div>
            <div className="form-group">
              <label>IP Address</label>
              <input name="ipAddress" value={form.ipAddress} onChange={handleChange}
                placeholder="192.168.x.x" className="form-input" readOnly={viewOnly} />
            </div>
            <div className="form-group form-full">
              <label>Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange}
                rows={3} placeholder="Any additional notes…" className="form-input form-textarea"
                readOnly={viewOnly} />
            </div>
          </div>
        </div>

        {!viewOnly && (
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/assets')}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? '💾 Save Changes' : '➕ Add Asset'}
            </button>
          </div>
        )}
      </form>

      {/* ── Asset History Timeline ── */}
      {isEdit && (
        <div className="history-card">
          <h3 className="history-title">🕐 Asset History</h3>

          {historyLoading ? (
            <div className="history-empty">Loading history…</div>
          ) : history.length === 0 ? (
            <div className="history-empty">No history recorded for this asset yet.</div>
          ) : (
            <div className="timeline">
              {history.map((log, i) => {
                const meta = ACTION_META[log.action] || { label: log.action, color: '#888', icon: '•' }
                return (
                  <div key={log._id} className="timeline-item">
                    <div className="timeline-line">
                      <div className="timeline-dot" style={{ background: meta.color }}>
                        <span className="timeline-dot-icon">{meta.icon}</span>
                      </div>
                      {i < history.length - 1 && <div className="timeline-connector" />}
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <span className="timeline-action" style={{ color: meta.color }}>{meta.label}</span>
                        <span className="timeline-time">{fmt(log.createdAt)}</span>
                      </div>
                      <div className="timeline-meta">
                        <span className="timeline-user">👤 {log.user?.name || '—'}</span>
                        <span className="timeline-role" style={{ color: ROLE_COLORS[log.user?.role] || '#888' }}>
                          {log.user?.role || ''}
                        </span>
                      </div>
                      {log.details && log.details !== 'No changes' && (
                        <div className="timeline-details">{log.details}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
