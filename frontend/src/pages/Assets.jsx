import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import api from '../api/axios'
import { mockGetAssets, mockDeleteAsset } from '../api/mockApi'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import ImportModal from '../components/ImportModal'
import DuplicateModal from '../components/DuplicateModal'
import './Dashboard.css'
import './Assets.css'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

const ASSET_TYPES = ['PC','Notebook','Printer','Scanner','Barcode Printer','Server','Access Point (AP)','Monitor PACS','Barcode Reader','Switch','UPS','Other']
const REMARKS_LIST = ['OK','Missing','Under Maintenance','Disposed','Faulty','Belum Sign']

export default function Assets() {
  const { can } = useAuth()
  const [assets, setAssets]   = useState([])
  const [total, setTotal]     = useState(0)
  const [pages, setPages]     = useState(1)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(true)
  const [pageInput, setPageInput] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [showImport, setShowImport]       = useState(false)
  const [showDuplicates, setShowDuplicates] = useState(false)

  const [filters, setFilters] = useState({
    search: '', assetType: '', remarks: '', location: '',
    sortBy: 'no', sortOrder: 'asc',
  })

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20, ...filters }
      Object.keys(params).forEach(k => !params[k] && delete params[k])
      const { data } = DEMO
        ? await mockGetAssets(params)
        : await api.get('/assets', { params })
      setAssets(data.assets)
      setTotal(data.total)
      setPages(data.pages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => { fetchAssets() }, [fetchAssets])

  const handleFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }))
    setPage(1)
  }

  const handleSort = (col) => {
    setFilters(f => ({
      ...f,
      sortBy: col,
      sortOrder: f.sortBy === col && f.sortOrder === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset? This cannot be undone.')) return
    setDeleting(id)
    try {
      DEMO ? await mockDeleteAsset(id) : await api.delete(`/assets/${id}`)
      fetchAssets()
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const handleClearAll = async () => {
    const first = window.confirm(
      `⚠️ DANGER WARNING!\n\nThis action will DELETE ALL ASSETS from the database.\nThis CANNOT be undone!\n\nAre you sure you want to continue?`
    )
    if (!first) return
    const second = window.confirm(
      `⚠️ SECOND CONFIRMATION\n\nClick OK again to confirm deleting ALL assets.\nNo backup will be created.`
    )
    if (!second) return
    try {
      const { data } = await api.delete('/assets/all')
      alert(`✅ ${data.message}`)
      fetchAssets()
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || 'Clear failed'))
    }
  }

  const exportExcel = async () => {
    try {
      const params = { ...filters, limit: 99999, page: 1 }
      const { data } = DEMO
        ? await mockGetAssets(params)
        : await api.get('/assets', { params })
      const rows = data.assets.map((a, i) => ({
        'NO': a.no,
        'SERIAL NUMBER': a.serialNumber,
        'ASSET TYPE': a.assetType,
        'LOCATION': a.location,
        'SUB LOCATION': a.subLocation || '',
        'BUILDING': a.building || '',
        'MODEL': a.model,
        'DATE TAGGED': a.dateTagged ? new Date(a.dateTagged).toLocaleDateString('en-MY') : '',
        'REMARKS': a.remarks,
        'ASSIGNED TO': a.assignedTo || '',
        'IP ADDRESS': a.ipAddress || '',
        'NOTES': a.notes || '',
      }))
      const ws = XLSX.utils.json_to_sheet(rows)
      // Column widths
      ws['!cols'] = [
        {wch:6},{wch:16},{wch:18},{wch:14},{wch:20},{wch:10},{wch:30},{wch:14},{wch:14},{wch:18},{wch:14},{wch:20}
      ]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Assets')
      XLSX.writeFile(wb, `HRPB_Assets_${new Date().toISOString().slice(0,10)}.xlsx`)
    } catch (err) {
      alert('Export failed: ' + (err.response?.data?.message || err.message))
    }
  }

  const sortIcon = (col) => {
    if (filters.sortBy !== col) return ' ↕'
    return filters.sortOrder === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Asset Inventory</h1>
          <p className="page-sub">{total} assets found · HRPB</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {can('export') && (
            <button className="btn-secondary" onClick={exportExcel}>⬇ Export Excel</button>
          )}
          {can('create') && (
            <button className="btn-secondary" onClick={() => setShowImport(true)}>📥 Import Excel</button>
          )}
          {can('delete') && (
            <button className="btn-secondary" style={{ color: '#f59e0b', borderColor: '#f59e0b55' }} onClick={() => setShowDuplicates(true)}>
              🔍 Detect Duplicates
            </button>
          )}
          {can('delete') && (
            <button
              className="btn-secondary"
              style={{ color: '#ef4444', borderColor: '#ef444455', fontWeight: 600 }}
              onClick={handleClearAll}
              title="Delete ALL assets from database"
            >
              🗑 Clear All Assets
            </button>
          )}
          {can('create') && (
            <Link to="/assets/new" className="btn-primary">+ Add Asset</Link>
          )}
        </div>
      </div>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => { fetchAssets(); setShowImport(false) }}
        />
      )}

      {showDuplicates && (
        <DuplicateModal
          onClose={() => setShowDuplicates(false)}
          onDeleted={() => fetchAssets()}
        />
      )}

      {/* Filters */}
      <div className="filter-bar">
        <input
          className="filter-input"
          placeholder="Search serial, model, location…"
          value={filters.search}
          onChange={e => handleFilter('search', e.target.value)}
        />
        <select className="filter-select" value={filters.assetType} onChange={e => handleFilter('assetType', e.target.value)}>
          <option value="">All Types</option>
          {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="filter-select" value={filters.remarks} onChange={e => handleFilter('remarks', e.target.value)}>
          <option value="">All Status</option>
          {REMARKS_LIST.map(r => <option key={r}>{r}</option>)}
        </select>
        <input
          className="filter-input"
          placeholder="Location (e.g. WAD 1A)"
          value={filters.location}
          onChange={e => handleFilter('location', e.target.value)}
          style={{ maxWidth: 180 }}
        />
      </div>

      {/* Table */}
      <div className="table-card">
        {loading ? (
          <div className="loading-state">Loading assets…</div>
        ) : assets.length === 0 ? (
          <div className="loading-state">No assets found.</div>
        ) : (
          <div className="table-wrap">
            <table className="asset-table">
              <thead>
                <tr>
                  {[['no','NO'],['serialNumber','SERIAL NUMBER'],['assetType','TYPE'],['location','LOCATION'],
                    ['subLocation','SUB LOCATION'],['building','BUILDING'],['model','MODEL'],
                    ['dateTagged','DATE TAGGED'],['remarks','STATUS']].map(([col, label]) => (
                    <th key={col} onClick={() => handleSort(col)} className="sortable-th">
                      {label}{sortIcon(col)}
                    </th>
                  ))}
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(a => (
                  <tr key={a._id}>
                    <td>{a.no}</td>
                    <td>
                      <Link to={`/assets/${a._id}`} className="link-cell">{a.serialNumber}</Link>
                    </td>
                    <td><span className="type-pill">{a.assetType}</span></td>
                    <td>{a.location}</td>
                    <td>{a.subLocation}</td>
                    <td>{a.building}</td>
                    <td className="model-cell">{a.model}</td>
                    <td>{a.dateTagged ? new Date(a.dateTagged).toLocaleDateString('en-MY') : '—'}</td>
                    <td>
                      <span className={`badge badge-${a.remarks?.toLowerCase().replace(/ /g,'-')}`}>
                        {a.remarks}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <Link to={`/assets/${a._id}`} className="act-btn act-view" title="View">👁</Link>
                        {can('edit') && (
                          <Link to={`/assets/${a._id}/edit`} className="act-btn act-edit" title="Edit">✏️</Link>
                        )}
                        {can('delete') && (
                          <button
                            className="act-btn act-delete"
                            title="Delete"
                            onClick={() => handleDelete(a._id)}
                            disabled={deleting === a._id}
                          >🗑</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>

            <div className="page-jump">
              <span className="page-info-label">Page</span>
              <input
                className="page-jump-input"
                type="number"
                min={1}
                max={pages}
                value={pageInput !== '' ? pageInput : page}
                onChange={e => setPageInput(e.target.value)}
                onFocus={e => { setPageInput(String(page)); e.target.select() }}
                onBlur={() => {
                  const n = parseInt(pageInput)
                  if (!isNaN(n) && n >= 1 && n <= pages) setPage(n)
                  setPageInput('')
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const n = parseInt(pageInput)
                    if (!isNaN(n) && n >= 1 && n <= pages) setPage(n)
                    setPageInput('')
                    e.target.blur()
                  }
                  if (e.key === 'Escape') { setPageInput(''); e.target.blur() }
                }}
              />
              <span className="page-info-label">of {pages}</span>
            </div>

            <button className="page-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </Layout>
  )
}
