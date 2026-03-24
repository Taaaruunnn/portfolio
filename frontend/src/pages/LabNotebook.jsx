import { useRef, useState, useEffect } from 'react'
import { getLabEntries, uploadLabFile } from '@/services/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import './LabNotebook.css'

export default function LabNotebook() {
    const fileRef = useRef(null)
    const [file, setFile] = useState(null)
    const [title, setTitle] = useState('')
    const [drag, setDrag] = useState(false)
    const [status, setStatus] = useState(null) // null | 'uploading' | 'done' | 'error'
    const [errMsg, setErrMsg] = useState('')

    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [listError, setListError] = useState(null)

    // Load entries on mount
    useEffect(() => {
        let cancelled = false
        getLabEntries()
            .then(res => {
                if (!cancelled) setEntries(res.data.items || [])
            })
            .catch(err => {
                if (!cancelled)
                    setListError(
                        err?.type === 'network'
                            ? 'Backend offline — start Flask on :5000.'
                            : 'Failed to load lab entries.'
                    )
            })
            .finally(() => { if (!cancelled) setLoading(false) })

        return () => { cancelled = true }
    }, [status]) // re-fetch after a successful upload

    const handleDrop = (e) => {
        e.preventDefault()
        setDrag(false)
        const f = e.dataTransfer.files[0]
        if (f) setFile(f)
    }

    const handleUpload = async () => {
        if (!file || !title.trim()) {
            setStatus('error')
            setErrMsg('Title and file are required.')
            return
        }

        setStatus('uploading')
        setErrMsg('')

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('title', title.trim())

            await uploadLabFile(formData)
            setStatus('done')
            setFile(null)
            setTitle('')
        } catch (err) {
            setStatus('error')
            setErrMsg(
                err?.type === 'network'
                    ? 'Backend offline — start Flask on :5000.'
                    : err?.message || 'Upload failed.'
            )
        }
    }

    return (
        <main className="page-content">
            <section className="section">
                <div className="container">

                    <div className="section-header animate-fade-up">
                        <p className="section-label">Research</p>
                        <h1 className="section-title">Lab Notebook</h1>
                        <p className="section-subtitle">Personal research log — techniques, exploits, and observations.</p>
                    </div>

                    {/* Upload panel */}
                    <div className="lab__upload-panel glass-card animate-fade-up delay-100">
                        <h2 className="lab__upload-title">Upload Lab Entry</h2>

                        <div
                            className={`lab__drop-zone ${drag ? 'lab__drop-zone--active' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
                            onDragLeave={() => setDrag(false)}
                            onDrop={handleDrop}
                            onClick={() => fileRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            aria-label="Drop file here or click to select"
                            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
                        >
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".txt,.md,.pdf,.png,.jpg"
                                style={{ display: 'none' }}
                                onChange={(e) => setFile(e.target.files[0])}
                            />
                            <span className="lab__drop-icon">📁</span>
                            {file
                                ? <p className="lab__drop-label neon-text">{file.name}</p>
                                : <p className="lab__drop-label">Drop file here or <span className="neon-text">click to select</span></p>
                            }
                            <p className="lab__drop-hint">Accepted: .txt · .md · .pdf · .png · .jpg (max 10 MB)</p>
                        </div>

                        <input
                            type="text"
                            className="lab__input"
                            placeholder="Entry title *"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            aria-label="Entry title"
                        />

                        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                            <button
                                className="cyber-btn"
                                onClick={handleUpload}
                                disabled={status === 'uploading'}
                            >
                                {status === 'uploading' ? 'Uploading…' : 'Upload Entry'}
                            </button>
                            {status === 'done' && (
                                <span className="neon-text" style={{ fontSize: 'var(--text-sm)' }}>✓ Uploaded successfully</span>
                            )}
                            {status === 'error' && (
                                <span style={{ color: 'var(--accent-orange)', fontSize: 'var(--text-sm)' }}>✗ {errMsg}</span>
                            )}
                        </div>
                    </div>

                    {/* Entry list */}
                    <div className="section-header animate-fade-up" style={{ marginTop: 'var(--space-12)' }}>
                        <p className="section-label">Entries</p>
                        <h2 className="section-title">Research Log</h2>
                    </div>

                    {loading && <LoadingSpinner label="Loading entries…" />}

                    {listError && !loading && (
                        <div className="terminal-box animate-fade-up">
                            <p style={{ color: 'var(--accent-orange)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                                ✗ {listError}
                            </p>
                        </div>
                    )}

                    {!loading && !listError && entries.length === 0 && (
                        <div className="terminal-box animate-fade-up">
                            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                                $ ls lab/ → (empty) — upload your first entry above
                            </p>
                        </div>
                    )}

                    {!loading && entries.length > 0 && (
                        <div className="grid-cards">
                            {entries.map((e, i) => (
                                <div key={e.id} className={`glass-card lab__entry animate-fade-up delay-${Math.min((i + 1) * 100, 500)}`}>
                                    <div className="lab__entry-meta">
                                        <time className="lab__entry-date">{e.created_at?.slice(0, 10) ?? '—'}</time>
                                        {e.file_type && (
                                            <span className="cyber-badge cyber-badge-blue">{e.file_type}</span>
                                        )}
                                    </div>
                                    <h3 className="lab__entry-title">{e.title}</h3>
                                    {e.filename && (
                                        <p className="lab__entry-notes">{e.filename}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </section>
        </main>
    )
}
