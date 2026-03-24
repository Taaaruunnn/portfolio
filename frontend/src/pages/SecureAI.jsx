import { useState, useRef, useEffect } from 'react'
import { queryRAG } from '@/services/ragApi'
import './SecureAI.css'

const EXAMPLE_QUESTIONS = [
    'What is a buffer overflow attack?',
    'How do ROP chains bypass NX protection?',
    'Explain SQL injection and how to prevent it',
    'What is prompt injection in LLM applications?',
]

export default function SecureAI() {
    const [question, setQuestion] = useState('')
    const [messages, setMessages] = useState([
        {
            role: 'system',
            content: '[ SecureAI initialised — BM25 retrieval engine active. Ask a security question. ]',
        },
    ])
    const [loading, setLoading] = useState(false)
    const bottomRef = useRef(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async () => {
        const q = question.trim()
        if (!q || loading) return

        setMessages((prev) => [...prev, { role: 'user', content: q }])
        setQuestion('')
        setLoading(true)

        try {
            const result = await queryRAG(q)
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: result.answer || 'No answer returned.',
                    sources: result.sources || [],
                    confidence: result.confidence || 0,
                    method: result.method || 'bm25',
                },
            ])
        } catch (err) {
            const errMsg =
                (err?.type === 'rate_limit' ? 'Rate limit reached. Wait a moment before asking again.' : null) ||
                (err?.type === 'network' ? 'Backend offline. Start the Flask server on :5000.' : null) ||
                err?.message ||
                'An error occurred. Please try again.'

            setMessages((prev) => [
                ...prev,
                { role: 'error', content: errMsg },
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <main className="page-content">
            <section className="section">
                <div className="container secureai__container">

                    <div className="section-header animate-fade-up">
                        <p className="section-label">AI Research Assistant</p>
                        <h1 className="section-title">
                            SecureAI{' '}
                            <span
                                className="cyber-badge cyber-badge-purple"
                                style={{ verticalAlign: 'middle', fontSize: 'var(--text-sm)' }}
                            >
                                BM25
                            </span>
                        </h1>
                        <p className="section-subtitle">
                            Ask any security question. Retrieves answers from my research notes
                            using BM25 + cosine re-ranking. Prompt injection protection is active.
                        </p>
                    </div>

                    {/* Guard Status */}
                    <div className="secureai__guard-bar glass-card animate-fade-up delay-100">
                        <span className="secureai__guard-item">
                            <span className="status-dot" />
                            Prompt injection guard: <span className="neon-text">ACTIVE</span>
                        </span>
                        <span className="secureai__guard-item">
                            <span className="status-dot" />
                            BM25 retrieval: <span className="neon-text">ACTIVE</span>
                        </span>
                        <span className="secureai__guard-item secureai__guard-item--muted">
                            <span
                                className="status-dot"
                                style={{ background: 'var(--text-muted)' }}
                            />
                            OpenAI augmentation: <span style={{ color: 'var(--text-muted)' }}>optional (via env)</span>
                        </span>
                    </div>

                    {/* Chat panel */}
                    <div className="secureai__chat glass-card animate-fade-up delay-200">
                        <div className="secureai__messages">
                            {messages.map((m, i) => (
                                <div key={i} className={`secureai__msg secureai__msg--${m.role}`}>
                                    <span className="secureai__msg-role">
                                        {m.role === 'user' && '> user'}
                                        {m.role === 'assistant' && '> ai'}
                                        {m.role === 'system' && '# system'}
                                        {m.role === 'error' && '✗ error'}
                                    </span>

                                    <p className="secureai__msg-content">{m.content}</p>

                                    {/* Method + confidence badges */}
                                    {m.role === 'assistant' && (
                                        <div className="secureai__msg-meta">
                                            <span className="cyber-badge" style={{ fontSize: '10px' }}>
                                                {m.method === 'openai' ? '✦ OpenAI' : '⬡ BM25'}
                                            </span>
                                            <span className="cyber-badge" style={{ fontSize: '10px' }}>
                                                confidence: {Math.round((m.confidence || 0) * 100)}%
                                            </span>
                                        </div>
                                    )}

                                    {/* Sources accordion */}
                                    {m.sources && m.sources.length > 0 && (
                                        <details className="secureai__sources">
                                            <summary className="secureai__sources-toggle">
                                                {m.sources.length} source{m.sources.length > 1 ? 's' : ''} retrieved
                                            </summary>
                                            <ul className="secureai__sources-list">
                                                {m.sources.map((s, si) => (
                                                    <li key={si} className="secureai__source-item">
                                                        <span className="neon-text" style={{ fontSize: '10px', marginRight: '6px' }}>
                                                            [{Math.round(s.score * 100)}%]
                                                        </span>
                                                        <span>{s.title}</span>
                                                        <span className="cyber-badge" style={{ marginLeft: '6px', fontSize: '9px' }}>
                                                            {s.source}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </details>
                                    )}
                                </div>
                            ))}

                            {loading && (
                                <div className="secureai__msg secureai__msg--assistant">
                                    <span className="secureai__msg-role">&gt; ai</span>
                                    <p className="secureai__msg-content secureai__thinking">
                                        Searching knowledge base
                                        <span className="animate-fade-in delay-200">.</span>
                                        <span className="animate-fade-in delay-400">.</span>
                                        <span className="animate-fade-in delay-600">.</span>
                                    </p>
                                </div>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div className="secureai__input-area">
                            <textarea
                                className="secureai__textarea"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder="Ask a security question… (Enter to send, Shift+Enter for newline)"
                                rows={3}
                                maxLength={1000}
                                disabled={loading}
                                aria-label="Security question input"
                            />
                            <div className="secureai__input-footer">
                                <span className="secureai__char-count">{question.length}/1000</span>
                                <button
                                    className="cyber-btn"
                                    onClick={handleSend}
                                    disabled={!question.trim() || loading}
                                >
                                    {loading ? 'Searching…' : 'Send →'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Example questions */}
                    <div className="secureai__examples animate-fade-up delay-300">
                        <p className="section-label" style={{ marginBottom: 'var(--space-3)' }}>
                            Try asking:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                            {EXAMPLE_QUESTIONS.map((q) => (
                                <button
                                    key={q}
                                    className="secureai__example-btn"
                                    onClick={() => setQuestion(q)}
                                    disabled={loading}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </section>
        </main>
    )
}
