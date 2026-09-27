import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { mockGetAssetStats } from '../api/mockApi'
import Layout from '../components/Layout'
import './Dashboard.css'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

const STAT_CARDS = [
  { key: 'total',       label: 'Total Assets',     color: '#6366f1', icon: '🖥' },
  { key: 'ok',          label: 'OK',               color: '#10b981', icon: '✅' },
  { key: 'missing',     label: 'Missing',          color: '#ef4444', icon: '⚠️' },
  { key: 'maintenance', label: 'Under Maintenance',color: '#f59e0b', icon: '🔧' },
  { key: 'disposed',    label: 'Disposed',         color: '#6b7280', icon: '🗑' },
  { key: 'faulty',      label: 'Faulty',           color: '#ec4899', icon: '❌' },
  { key: 'belumSign',   label: 'Belum Sign',       color: '#8b5cf6', icon: '📝' },
]

export default function Dashboard() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = DEMO ? mockGetAssetStats : () => api.get('/assets/stats')
    fetch()
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><div className="loading-state">Loading dashboard…</div></Layout>

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Hospital Raja Permaisuri Bainun — IT Asset Overview</p>
        </div>
        <Link to="/assets/new" className="btn-primary">+ Add Asset</Link>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {STAT_CARDS.map(c => (
          <div key={c.key} className="stat-card" style={{ '--accent': c.color }}>
            <div className="stat-icon">{c.icon}</div>
            <div className="stat-value">{stats?.[c.key] ?? 0}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        {/* By Asset Type */}
        <div className="dash-card">
          <h2 className="card-title">Assets by Type</h2>
          <div className="bar-list">
            {stats?.byType?.map(item => {
              const pct = stats.total ? Math.round((item.count / stats.total) * 100) : 0
              return (
                <div key={item._id} className="bar-row">
                  <span className="bar-label">{item._id}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="bar-count">{item.count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* By Location */}
        <div className="dash-card">
          <h2 className="card-title">Top Locations</h2>
          <div className="bar-list">
            {stats?.byLocation?.map(item => {
              const pct = stats.total ? Math.round((item.count / stats.total) * 100) : 0
              return (
                <div key={item._id} className="bar-row">
                  <span className="bar-label">{item._id}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%`, background: '#6366f1' }} />
                  </div>
                  <span className="bar-count">{item.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent Assets */}
      <div className="dash-card" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="card-title" style={{ margin: 0 }}>Recently Added</h2>
          <Link to="/assets" className="link-more">View All →</Link>
        </div>
        <div className="recent-table-wrap">
          <table className="recent-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>Serial Number</th>
                <th>Type</th>
                <th>Location</th>
                <th>Model</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent?.map(a => (
                <tr key={a._id}>
                  <td>{a.no}</td>
                  <td><Link to={`/assets/${a._id}`} className="link-cell">{a.serialNumber}</Link></td>
                  <td>{a.assetType}</td>
                  <td>{a.location}</td>
                  <td>{a.model}</td>
                  <td><span className={`badge badge-${a.remarks?.toLowerCase().replace(' ', '-')}`}>{a.remarks}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
