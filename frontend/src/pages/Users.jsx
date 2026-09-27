import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { mockGetUsers, mockCreateUser, mockUpdateUser, mockDeleteUser } from '../api/mockApi'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import './Dashboard.css'
import './Assets.css'
import './Modal.css'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

const ROLES = ['superuser','manager','engineer']
const EMPTY_USER = { name:'', email:'', password:'', role:'engineer', department:'IT' }

export default function Users() {
  const { user: me } = useAuth()
  const navigate = useNavigate()

  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null)   // null | 'add' | 'edit' | 'password'
  const [selected, setSelected] = useState(null)
  const [form, setForm]       = useState(EMPTY_USER)
  const [newPass, setNewPass] = useState('')
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  if (me?.role !== 'superuser') { navigate('/dashboard'); return null }

  const fetchUsers = () => {
    setLoading(true)
    const fn = DEMO ? mockGetUsers : () => api.get('/users')
    fn()
      .then(r => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }
  useEffect(() => fetchUsers(), [])

  const openAdd = () => { setForm(EMPTY_USER); setError(''); setModal('add') }
  const openEdit = (u) => {
    setSelected(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role, department: u.department || 'IT' })
    setError('')
    setModal('edit')
  }
  const openPass = (u) => { setSelected(u); setNewPass(''); setError(''); setModal('password') }
  const closeModal = () => { setModal(null); setSelected(null); setError('') }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (modal === 'add') {
        DEMO ? await mockCreateUser(form) : await api.post('/users', form)
      } else if (modal === 'edit') {
        DEMO ? await mockUpdateUser(selected._id, form) : await api.put(`/users/${selected._id}`, form)
      } else if (modal === 'password') {
        if (!DEMO) await api.put(`/users/${selected._id}/password`, { password: newPass })
        else alert('Password reset simulated in demo mode.')
      }
      fetchUsers()
      closeModal()
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.name}"?`)) return
    try {
      DEMO ? await mockDeleteUser(u._id) : await api.delete(`/users/${u._id}`)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleToggleActive = async (u) => {
    try {
      DEMO
        ? await mockUpdateUser(u._id, { ...u, isActive: !u.isActive })
        : await api.put(`/users/${u._id}`, { ...u, isActive: !u.isActive })
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed')
    }
  }

  const roleColor = { superuser: '#ff4d6d', manager: '#f59e0b', engineer: '#10b981' }

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-sub">{users.length} users · Superuser access only</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add User</button>
      </div>

      <div className="table-card">
        {loading ? <div className="loading-state">Loading users…</div> : (
          <div className="table-wrap">
            <table className="asset-table">
              <thead>
                <tr>
                  <th>NAME</th><th>EMAIL</th><th>ROLE</th><th>DEPARTMENT</th><th>STATUS</th><th>LAST LOGIN</th><th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className="type-pill" style={{ background: roleColor[u.role]+'22', color: roleColor[u.role] }}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.department}</td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-ok' : 'badge-disposed'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-MY') : '—'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="act-btn act-edit" title="Edit" onClick={() => openEdit(u)}>✏️</button>
                        <button className="act-btn act-view" title="Reset Password" onClick={() => openPass(u)}>🔑</button>
                        {u._id !== me?._id && (
                          <>
                            <button className="act-btn" title={u.isActive ? 'Deactivate' : 'Activate'} onClick={() => handleToggleActive(u)}>
                              {u.isActive ? '🔒' : '🔓'}
                            </button>
                            <button className="act-btn act-delete" title="Delete" onClick={() => handleDelete(u)}>🗑</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal === 'add' ? 'Add User' : modal === 'edit' ? 'Edit User' : 'Reset Password'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              {error && <div className="form-error">{error}</div>}
              {modal !== 'password' ? (
                <>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Full name" />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="user@examedia.com.my" />
                  </div>
                  {modal === 'add' && (
                    <div className="form-group">
                      <label>Password *</label>
                      <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Min 6 characters" />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Role *</label>
                    <select className="form-input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                      {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input className="form-input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="IT" />
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label>New Password for {selected?.name} *</label>
                  <input className="form-input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} required placeholder="Min 6 characters" minLength={6} />
                </div>
              )}
              <div className="form-actions" style={{ padding: '16px 0 0', background: 'none', borderTop: 'none' }}>
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
