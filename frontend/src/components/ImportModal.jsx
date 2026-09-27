import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import api from '../api/axios'
import { mockImportAssets } from '../api/mockApi'
import './ImportModal.css'

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

const ASSET_TYPES = [
  'PC', 'Notebook', 'Printer', 'Scanner', 'Barcode Printer',
  'Server', 'Access Point (AP)', 'Monitor PACS', 'Barcode Reader', 'Switch', 'UPS', 'Other',
]

// Map your Excel column headers → our field names
const COL_MAP = {
  'NO':           'no',
  'SERIAL NUMBER':'serialNumber',
  'SERIAL NO':    'serialNumber',
  'LOCATION':     'location',
  'SUB LOCATION': 'subLocation',
  'SUB_LOCATION': 'subLocation',
  'BUILDING':     'building',
  'MODEL':        'model',
  'DATE TAGGED':  'dateTagged',
  'DATE_TAGGED':  'dateTagged',
  'REMARKS':      'remarks',
  'STATUS':       'remarks',
}

// Normalise a remarks/status value to our enum
const normaliseRemarks = (val) => {
  if (!val) return 'OK'
  const v = String(val).trim().toUpperCase()
  if (v === 'OK')                              return 'OK'
  if (v === 'MISSING')                         return 'Missing'
  if (v.includes('MAINTENANCE'))               return 'Under Maintenance'
  if (v.includes('DISPOS'))                    return 'Disposed'
  if (v.includes('FAULT') || v === 'FAULTY')   return 'Faulty'
  if (v.includes('BELUM') || v.includes('SIGN')) return 'Belum Sign'
  return 'OK'
}

// Parse an Excel date serial or string into ISO date string
const parseDate = (val) => {
  if (!val) return ''
  if (typeof val === 'number') {
    // Excel date serial
    const d = XLSX.SSF.parse_date_code(val)
    if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`
  }
  const s = String(val).trim()
  if (!s) return ''
  // DD/MM/YYYY or MM/DD/YYYY
  const parts = s.split(/[\/\-\.]/)
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number)
    if (c > 1900) return `${c}-${String(b).padStart(2,'0')}-${String(a).padStart(2,'0')}`
    if (a > 1900) return `${a}-${String(b).padStart(2,'0')}-${String(c).padStart(2,'0')}`
  }
  return s
}

export default function ImportModal({ onClose, onImported }) {
  const [step, setStep]           = useState(1)   // 1=choose type, 2=upload+preview, 3=result
  const [assetType, setAssetType] = useState('')
  const [rows, setRows]           = useState([])
  const [fileName, setFileName]   = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState('')
  const fileRef = useRef()

  // ── Step 2: Parse Excel ──────────────────────────────────────────────────
  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    setError('')

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array', cellDates: false })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

        // Find header row (first row containing SERIAL NUMBER)
        let headerIdx = 0
        for (let i = 0; i < Math.min(10, raw.length); i++) {
          const rowStr = raw[i].join(' ').toUpperCase()
          if (rowStr.includes('SERIAL')) { headerIdx = i; break }
        }

        const headers = raw[headerIdx].map(h => String(h).trim().toUpperCase())
        const dataRows = raw.slice(headerIdx + 1).filter(r => r.some(c => c !== ''))

        const parsed = dataRows.map(row => {
          const obj = {}
          headers.forEach((h, i) => {
            const field = COL_MAP[h]
            if (field) obj[field] = row[i]
          })
          return {
            assetType,
            serialNumber: String(obj.serialNumber || '').trim(),
            location:     String(obj.location     || '').trim(),
            subLocation:  String(obj.subLocation  || '').trim(),
            building:     String(obj.building     || 'MB').trim(),
            model:        String(obj.model        || '').trim(),
            dateTagged:   parseDate(obj.dateTagged),
            remarks:      normaliseRemarks(obj.remarks),
            no:           Number(obj.no) || 0,
            assignedTo: '', ipAddress: '', notes: '',
          }
        }).filter(r => r.serialNumber) // must have serial number

        if (parsed.length === 0) {
          setError('No valid rows found. Make sure your Excel has SERIAL NUMBER column.')
          return
        }
        setRows(parsed)
        setStep(2)
      } catch (err) {
        setError('Failed to parse Excel: ' + err.message)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // ── Step 3: Import ───────────────────────────────────────────────────────
  const handleImport = async () => {
    setImporting(true)
    setError('')
    try {
      const { data } = DEMO
        ? await mockImportAssets({ assets: rows })
        : await api.post('/assets/import', { assets: rows })
      setResult(data)
      setStep(3)
      onImported?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const remarksBadge = (r) => {
    const map = {
      'OK': 'badge-ok', 'Missing': 'badge-missing',
      'Under Maintenance': 'badge-under-maintenance',
      'Disposed': 'badge-disposed', 'Faulty': 'badge-faulty',
      'Belum Sign': 'badge-belum-sign',
    }
    return map[r] || 'badge-ok'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box import-modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div>
            <h2>📥 Import Assets from Excel</h2>
            <div className="import-steps">
              <span className={step >= 1 ? 'step active' : 'step'}>1 · Choose Type</span>
              <span className="step-arrow">›</span>
              <span className={step >= 2 ? 'step active' : 'step'}>2 · Upload & Preview</span>
              <span className="step-arrow">›</span>
              <span className={step >= 3 ? 'step active' : 'step'}>3 · Result</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Step 1: Choose asset type ── */}
        {step === 1 && (
          <div className="import-step-body">
            <p className="import-hint">
              Your Excel file does not have an Asset Type column.<br />
              Select the type of assets you are importing first.
            </p>
            <div className="type-grid">
              {ASSET_TYPES.map(t => (
                <button
                  key={t}
                  className={`type-card ${assetType === t ? 'type-card-selected' : ''}`}
                  onClick={() => setAssetType(t)}
                >
                  <span className="type-card-icon">{typeIcon(t)}</span>
                  <span>{t}</span>
                </button>
              ))}
            </div>
            <div className="import-footer">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
              <button
                className="btn-primary"
                disabled={!assetType}
                onClick={() => { setStep(2); setTimeout(() => fileRef.current?.click(), 100) }}
              >
                Next → Upload Excel
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Upload & Preview ── */}
        {step === 2 && (
          <div className="import-step-body">
            <div className="import-type-badge">
              {typeIcon(assetType)} Importing: <strong>{assetType}</strong>
              <button className="change-type-btn" onClick={() => { setStep(1); setRows([]); setFileName('') }}>Change</button>
            </div>

            {/* Drop zone */}
            {rows.length === 0 && (
              <div className="drop-zone" onClick={() => fileRef.current?.click()}>
                <span className="drop-icon">📂</span>
                <p>Click to select Excel file (.xlsx / .xls)</p>
                <p className="drop-sub">Expected columns: NO · SERIAL NUMBER · LOCATION · SUB LOCATION · BUILDING · MODEL · DATE TAGGED · REMARKS</p>
              </div>
            )}
            <input type="file" ref={fileRef} accept=".xlsx,.xls,.csv" style={{ display:'none' }} onChange={handleFile} />

            {error && <div className="form-error">{error}</div>}

            {/* Preview table */}
            {rows.length > 0 && (
              <>
                <div className="preview-info">
                  <span>📄 {fileName}</span>
                  <strong>{rows.length} rows ready to import</strong>
                  <button className="change-type-btn" onClick={() => { setRows([]); setFileName(''); fileRef.current.value = '' }}>
                    Choose different file
                  </button>
                </div>
                <div className="preview-table-wrap">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>#</th><th>Serial Number</th><th>Location</th><th>Sub Location</th>
                        <th>Building</th><th>Model</th><th>Date Tagged</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((r, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td><strong>{r.serialNumber}</strong></td>
                          <td>{r.location}</td>
                          <td>{r.subLocation}</td>
                          <td>{r.building}</td>
                          <td className="model-cell">{r.model}</td>
                          <td>{r.dateTagged}</td>
                          <td><span className={`badge ${remarksBadge(r.remarks)}`}>{r.remarks}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 50 && (
                    <p className="preview-more">…and {rows.length - 50} more rows (all will be imported)</p>
                  )}
                </div>
              </>
            )}

            <div className="import-footer">
              <button className="btn-secondary" onClick={() => { setStep(1); setRows([]); setFileName('') }}>← Back</button>
              <button
                className="btn-primary"
                disabled={rows.length === 0 || importing}
                onClick={handleImport}
              >
                {importing ? 'Importing…' : `📥 Import ${rows.length} Records`}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Result ── */}
        {step === 3 && result && (
          <div className="import-step-body import-result">
            <div className="result-icon">{result.failed === 0 ? '✅' : '⚠️'}</div>
            <h3>Import Complete!</h3>
            <div className="result-stats">
              <div className="result-stat green">
                <span className="result-num">{result.imported}</span>
                <span>Imported</span>
              </div>
              <div className="result-stat red">
                <span className="result-num">{result.failed}</span>
                <span>Failed</span>
              </div>
            </div>
            {result.errors?.length > 0 && (
              <div className="skipped-list" style={{ borderColor: '#ef444433', background: '#ef444411' }}>
                <strong style={{ color: '#ef4444' }}>⚠️ Records that failed to import:</strong>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 13 }}>
                  {result.errors.map((e, i) => (
                    <li key={i}>
                      {e.serial && <strong>{e.serial}</strong>}{e.serial ? ' — ' : ''}{e.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="import-footer" style={{ justifyContent: 'center' }}>
              <button className="btn-primary" onClick={onClose}>Done</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function typeIcon(type) {
  const icons = {
    'PC': '🖥', 'Notebook': '💻', 'Printer': '🖨', 'Scanner': '🔍',
    'Barcode Printer': '🏷', 'Server': '🗄', 'Access Point (AP)': '📡',
    'Monitor PACS': '🖵', 'Barcode Reader': '📖', 'Switch': '🔀', 'UPS': '🔋', 'Other': '📦',
  }
  return icons[type] || '📦'
}
