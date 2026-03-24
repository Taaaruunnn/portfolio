import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { getBlogPost } from '@/services/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import './BlogPost.css'

// Configure marked: safe defaults
marked.setOptions({
    gfm: true,
    breaks: false,
})

export default function BlogPost() {
    const { slug } = useParams()
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const contentRef = useRef(null)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setPost(null)
        setError(null)

        getBlogPost(slug)
            .then(res => {
                if (!cancelled) setPost(res.data)
            })
            .catch(err => {
                if (!cancelled)
                    setError(
                        err?.status === 404
                            ? 'Post not found.'
                            : err?.type === 'network'
                                ? 'Backend offline — start Flask on :5000.'
                                : 'Failed to load post.'
                    )
            })
            .finally(() => { if (!cancelled) setLoading(false) })

        return () => { cancelled = true }
    }, [slug])

    // Safely render Markdown → sanitised HTML
    const renderedHtml = post?.content
        ? DOMPurify.sanitize(marked.parse(post.content))
        : ''

    return (
        <main className="page-content">
            <section className="section">
                <div className="container blogpost__container">

                    <Link to="/blog" className="blogpost__back neon-text">← Back to Blog</Link>

                    {loading && <LoadingSpinner label="Loading post…" />}

                    {error && !loading && (
                        <div className="terminal-box animate-fade-up">
                            <p style={{ color: 'var(--accent-orange)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                                ✗ {error}
                            </p>
                        </div>
                    )}

                    {post && !loading && (
                        <article className="animate-fade-up">
                            {/* Meta */}
                            <header className="blogpost__header">
                                <div className="blogpost__meta">
                                    <time className="blogpost__date">{post.created_at?.slice(0, 10) ?? '—'}</time>
                                    {post.read_time && (
                                        <span className="blogpost__read">{post.read_time} read</span>
                                    )}
                                </div>
                                <h1 className="blogpost__title">{post.title}</h1>
                                {post.tags?.length > 0 && (
                                    <div className="blogpost__tags">
                                        {post.tags.map(t => (
                                            <span key={t} className="cyber-badge">{t}</span>
                                        ))}
                                    </div>
                                )}
                            </header>

                            {/* Markdown body */}
                            <div
                                ref={contentRef}
                                className="blogpost__body"
                                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                            />
                        </article>
                    )}

                </div>
            </section>
        </main>
    )
}
