import { useState, useEffect } from 'react'
import api from '../api/axios'
import { mockGetDuplicates, mockDeleteAsset } from '../api/mockApi'
import './DuplicateModal.css'
import '../pages/Modal.css'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

export default function DuplicateModal({ onClose, onDeleted }) {
  const [loading, setLoading]   = useState(true)
  const [data, setData]         = useState(null)
  const [tab, setTab]           = useState('exact')    // 'exact' | 'potential'
  const [deleting, setDeleting] = useState(null)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = DEMO
        ? await mockGetDuplicates()
        : await api.get('/assets/duplicates')
      setData(res.data)
    } catch (err) {
      setError('Failed to load duplicates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (assetId) => {
    if (!window.confirm('Delete this asset? This cannot be undone.')) return
    setDeleting(assetId)
    try {
      DEMO ? await mockDeleteAsset(assetId) : await api.delete(`/assets/${assetId}`)
      onDeleted?.()
      await load()   // refresh the list
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('en-MY') : '—'

  const rawGroups = data ? (tab === 'exact' ? data.exact : data.potential) : []

  // Filter groups by search term
  const q = search.trim().toLowerCase()
  const groups = q
    ? rawGroups.filter(group => {
        if (tab === 'exact') {
          // search in _id (serial) or any doc's model/location/subLocation
          return (
            String(group._id).toLowerCase().includes(q) ||
            group.docs.some(d =>
              (d.model || '').toLowerCase().includes(q) ||
              (d.location || '').toLowerCase().includes(q) ||
              (d.subLocation || '').toLowerCase().includes(q) ||
              (d.assetType || '').toLowerCase().includes(q)
            )
          )
        } else {
          return (
            (group._id.model || '').toLowerCase().includes(q) ||
            (group._id.location || '').toLowerCase().includes(q) ||
            (group._id.subLocation || '').toLowerCase().includes(q) ||
            group.docs.some(d => (d.serialNumber || '').toLowerCase().includes(q))
          )
        }
      })
    : rawGroups

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box dup-modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>🔍 Duplicate Asset Detector</h2>
            {data && (
              <div className="dup-summary-chips">
                <span className={`dup-chip ${data.summary.exactAssets > 0 ? 'chip-red' : 'chip-green'}`}>
                  🔴 {data.summary.exactGroups} exact duplicate groups ({data.summary.exactAssets} assets)
                </span>
                <span className={`dup-chip ${data.summary.potentialAssets > 0 ? 'chip-yellow' : 'chip-green'}`}>
                  🟡 {data.summary.potentialGroups} potential duplicate groups
                </span>
              </div>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="dup-tabs">
          <button
            className={`dup-tab ${tab === 'exact' ? 'dup-tab-active' : ''}`}
            onClick={() => { setTab('exact'); setSearch('') }}
          >
            🔴 Exact Duplicates
            {data && <span className="dup-tab-badge">{data.summary.exactGroups}</span>}
          </button>
          <button
            className={`dup-tab ${tab === 'potential' ? 'dup-tab-active' : ''}`}
            onClick={() => { setTab('potential'); setSearch('') }}
          >
            🟡 Potential Duplicates
            {data && <span className="dup-tab-badge">{data.summary.potentialGroups}</span>}
          </button>
        </div>

        {/* Search Bar */}
        {!loading && !error && rawGroups.length > 0 && (
          <div className="dup-search-bar">
            <span className="dup-search-icon">🔍</span>
            <input
              className="dup-search-input"
              type="text"
              placeholder={tab === 'exact'
                ? 'Search serial number, model, location…'
                : 'Search model, location, serial…'
              }
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button className="dup-search-clear" onClick={() => setSearch('')} title="Clear search">
                ✕
              </button>
            )}
            <span className="dup-search-count">
              {groups.length} / {rawGroups.length} groups
            </span>
          </div>
        )}

        {/* Body */}
        <div className="dup-body">
          {loading ? (
            <div className="dup-loading">Scanning for duplicates…</div>
          ) : error ? (
            <div className="form-error">{error}</div>
          ) : groups.length === 0 ? (
            <div className="dup-empty">
              <span className="dup-empty-icon">{search ? '🔎' : '✅'}</span>
              <p>{search ? `No results for "${search}"` : `No ${tab === 'exact' ? 'exact' : 'potential'} duplicates found!`}</p>
              <span>{search ? 'Try a different search term or clear the search.' : 'Your asset database looks clean.'}</span>
              {search && <button className="btn-secondary" style={{ marginTop: 8, fontSize: 13 }} onClick={() => setSearch('')}>Clear Search</button>}
            </div>
          ) : (
            <div className="dup-groups">
              {tab === 'exact' && (
                <div className="dup-info-banner red">
                  ⚠️ These assets share the <strong>same serial number</strong>. Keep only one — delete the extras.
                </div>
              )}
              {tab === 'potential' && (
                <div className="dup-info-banner yellow">
                  ℹ️ These assets share the <strong>same Model + Location + Sub Location</strong>. Review whether they are truly different physical devices.
                </div>
              )}

              {groups.map((group, gi) => (
                <div key={gi} className="dup-group">
                  {/* Group Header */}
                  <div className="dup-group-header">
                    {tab === 'exact' ? (
                      <>
                        <span className="dup-group-title">Serial: <strong>{group._id}</strong></span>
                        <span className="dup-group-count badge-miss">{group.count} duplicates</span>
                      </>
                    ) : (
                      <>
                        <span className="dup-group-title">
                          <strong>{group._id.model}</strong>
                          <span className="dup-loc"> @ {group._id.location}{group._id.subLocation ? ` · ${group._id.subLocation}` : ''}</span>
                        </span>
                        <span className="dup-group-count badge-maint">{group.count} assets</span>
                      </>
                    )}
                  </div>

                  {/* Duplicate rows */}
                  <table className="dup-table">
                    <thead>
                      <tr>
                        <th>Serial Number</th>
                        <th>Type</th>
                        <th>Model</th>
                        <th>Location</th>
                        <th>Sub Location</th>
                        <th>Date Tagged</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.docs.map((doc, di) => (
                        <tr key={doc._id} className={di === 0 ? 'dup-row-keep' : 'dup-row-dupe'}>
                          <td><strong>{doc.serialNumber}</strong></td>
                          <td><span className="type-pill">{doc.assetType}</span></td>
                          <td className="dup-model">{doc.model}</td>
                          <td>{doc.location}</td>
                          <td>{doc.subLocation || '—'}</td>
                          <td>{fmt(doc.dateTagged)}</td>
                          <td>
                            <span className={`badge badge-${doc.remarks?.toLowerCase().replace(/ /g, '-')}`}>
                              {doc.remarks}
                            </span>
                          </td>
                          <td>
                            {di === 0 ? (
                              <span className="dup-keep-label">✓ Keep</span>
                            ) : (
                              <button
                                className="dup-delete-btn"
                                onClick={() => handleDelete(doc._id)}
                                disabled={deleting === doc._id}
                              >
                                {deleting === doc._id ? '…' : '🗑 Delete'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dup-footer">
          <span className="dup-footer-note">
            💡 First row in each group is suggested as the one to keep.
          </span>
          <button className="btn-secondary" onClick={load}>🔄 Rescan</button>
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
