import { useEffect, useState, useCallback } from 'react'
import api from '../api/axios'
import { mockGetLogs } from '../api/mockApi'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import './Dashboard.css'
import './Logs.css'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

const ACTION_LABELS = {
  created:  { label: 'Created',  cls: 'log-created'  },
  updated:  { label: 'Updated',  cls: 'log-updated'  },
  deleted:  { label: 'Deleted',  cls: 'log-deleted'  },
  imported: { label: 'Imported', cls: 'log-imported' },
}

const ROLE_COLORS = {
  superuser: '#ce182a', manager: '#f59e0b', engineer: '#3b82f6',
}

export default function Logs() {
  const { user } = useAuth()
  const isSuperuser = user?.role === 'superuser'
  const [logs, setLogs]     = useState([])
  const [total, setTotal]   = useState(0)
  const [pages, setPages]   = useState(1)
  const [page, setPage]     = useState(1)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 50, ...(action ? { action } : {}) }
      const { data } = DEMO
        ? await mockGetLogs(params)
        : await api.get('/logs', { params })
      setLogs(data.logs)
      setTotal(data.total)
      setPages(data.pages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, action])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const handleClearLog = async () => {
    const first = window.confirm(
      `⚠️ AMARAN!

Tindakan ini akan MEMADAM SEMUA activity log.
Ini TIDAK BOLEH dibatalkan!

Adakah anda pasti?`
    )
    if (!first) return
    const second = window.confirm('⚠️ PENGESAHAN KEDUA\n\nKlik OK untuk mengesahkan padam semua log.')
    if (!second) return
    try {
      const { data } = await api.delete('/logs')
      alert(`✅ ${data.message}`)
      fetchLogs()
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Clear log failed'))
    }
  }

  const fmt = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString('en-MY', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Log</h1>
          <p className="page-sub">{total} records — tracking all asset changes</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <select className="filter-select" value={action} onChange={e => { setAction(e.target.value); setPage(1) }}>
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="imported">Imported</option>
          </select>
          <button className="btn-secondary" onClick={fetchLogs}>🔄 Refresh</button>
          {isSuperuser && (
            <button
              className="btn-secondary"
              style={{ color: '#ef4444', borderColor: '#ef444455', fontWeight: 600 }}
              onClick={handleClearLog}
              title="Padam semua activity log (Superuser sahaja)"
            >
              🗑 Clear Log
            </button>
          )}
        </div>
      </div>

      <div className="table-card">
        {loading ? (
          <div className="loading-state">Loading logs…</div>
        ) : logs.length === 0 ? (
          <div className="loading-state">
            <div style={{ fontSize:'2rem', marginBottom:12 }}>📋</div>
            No activity recorded yet.<br/>
            <span style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>Actions on assets will appear here.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="asset-table log-table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Action</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Serial Number</th>
                  <th>Asset Type</th>
                  <th>Location</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => {
                  const act = ACTION_LABELS[l.action] || { label: l.action, cls: '' }
                  return (
                    <tr key={l._id}>
                      <td className="log-time">{fmt(l.createdAt)}</td>
                      <td><span className={`log-badge ${act.cls}`}>{act.label}</span></td>
                      <td className="log-user">{l.user?.name || '—'}</td>
                      <td>
                        <span className="log-role" style={{ color: ROLE_COLORS[l.user?.role] || '#888' }}>
                          {l.user?.role || '—'}
                        </span>
                      </td>
                      <td><strong>{l.asset?.serialNumber || '—'}</strong></td>
                      <td>{l.asset?.assetType || '—'}</td>
                      <td>{l.asset?.location || '—'}</td>
                      <td className="log-details">{l.details || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span className="page-info">Page {page} of {pages}</span>
            <button className="page-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </Layout>
  )
}
