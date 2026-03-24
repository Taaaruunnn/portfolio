import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getBlogPosts } from '@/services/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import './Blog.css'

export default function Blog() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let cancelled = false
        setLoading(true)

        getBlogPosts()
            .then(res => {
                if (!cancelled) setPosts(res.data.items || [])
            })
            .catch(err => {
                if (!cancelled)
                    setError(
                        err?.type === 'network'
                            ? 'Backend offline — start Flask on :5000.'
                            : err?.message || 'Failed to load posts.'
                    )
            })
            .finally(() => { if (!cancelled) setLoading(false) })

        return () => { cancelled = true }
    }, [])

    return (
        <main className="page-content">
            <section className="section">
                <div className="container">

                    <div className="section-header animate-fade-up">
                        <p className="section-label">Writing</p>
                        <h1 className="section-title">Security Blog</h1>
                        <p className="section-subtitle">Writeups, techniques, and research notes.</p>
                    </div>

                    {loading && <LoadingSpinner label="Loading posts…" />}

                    {error && !loading && (
                        <div className="terminal-box animate-fade-up">
                            <p style={{ color: 'var(--accent-orange)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                                ✗ {error}
                            </p>
                        </div>
                    )}

                    {!loading && !error && posts.length === 0 && (
                        <div className="terminal-box animate-fade-up">
                            <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                                $ ls blog/ → (empty) — publish posts via the admin API
                            </p>
                        </div>
                    )}

                    {!loading && !error && posts.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
                            {posts.map((post, i) => (
                                <article key={post.id} className={`glass-card blog-post animate-fade-up delay-${Math.min((i + 1) * 100, 500)}`}>
                                    <div className="blog-post__inner">
                                        <div className="blog-post__meta">
                                            <time className="blog-post__date">{post.created_at?.slice(0, 10) ?? '—'}</time>
                                            {post.read_time && (
                                                <span className="blog-post__read">{post.read_time} read</span>
                                            )}
                                        </div>
                                        <h2 className="blog-post__title">
                                            <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                                        </h2>
                                        {post.excerpt && (
                                            <p className="blog-post__excerpt">{post.excerpt}</p>
                                        )}
                                        <div className="blog-post__footer">
                                            <div className="blog-post__tags">
                                                {(post.tags || []).map(t => (
                                                    <span key={t} className="cyber-badge">{t}</span>
                                                ))}
                                            </div>
                                            <Link to={`/blog/${post.slug}`} className="blog-post__read-link neon-text">
                                                Read more →
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

                </div>
            </section>
        </main>
    )
}
