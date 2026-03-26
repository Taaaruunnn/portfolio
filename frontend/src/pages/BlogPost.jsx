import { useRef } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import BLOG_POSTS from '@/data/blogData'
import './BlogPost.css'

// Configure marked
marked.setOptions({ gfm: true, breaks: false })

export default function BlogPost() {
    const { slug } = useParams()
    const contentRef = useRef(null)

    const post = BLOG_POSTS.find(p => p.slug === slug)

    // If post not found, redirect to blog listing
    if (!post) return <Navigate to="/blog" replace />

    const renderedHtml = DOMPurify.sanitize(marked.parse(post.content))

    return (
        <main className="page-content">
            <section className="section">
                <div className="container blogpost__container">

                    <Link to="/blog" className="blogpost__back neon-text">← Back to Blog</Link>

                    <article className="animate-fade-up">
                        <header className="blogpost__header">
                            <div className="blogpost__meta">
                                <time className="blogpost__date">{post.date}</time>
                                <span className="blogpost__read">{post.read_time} read</span>
                            </div>
                            <h1 className="blogpost__title">{post.title}</h1>
                            <div className="blogpost__tags">
                                {post.tags.map(t => (
                                    <span key={t} className="cyber-badge">{t}</span>
                                ))}
                            </div>
                        </header>

                        <div
                            ref={contentRef}
                            className="blogpost__body"
                            dangerouslySetInnerHTML={{ __html: renderedHtml }}
                        />
                    </article>

                </div>
            </section>
        </main>
    )
}
