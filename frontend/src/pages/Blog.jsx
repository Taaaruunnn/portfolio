import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import BLOG_POSTS from '@/data/blogData'
import './Blog.css'

const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: i => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.12, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
}

export default function Blog() {
    return (
        <main className="page-content">
            <section className="section">
                <div className="container">

                    <motion.div
                        className="section-header"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <p className="section-label">Writing</p>
                        <h1 className="section-title">Security Blog</h1>
                        <p className="section-subtitle">Writeups, techniques, and research notes.</p>
                    </motion.div>

                    <div className="blog__list">
                        {BLOG_POSTS.map((post, i) => (
                            <motion.article
                                key={post.id}
                                className="glass-card blog-card"
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.2 }}
                                variants={cardVariants}
                                whileHover={{ scale: 1.01, transition: { duration: 0.25 } }}
                            >
                                <Link to={`/blog/${post.slug}`} className="blog-card__link">
                                    <div className="blog-card__meta">
                                        <time className="blog-card__date">{post.date}</time>
                                        <span className="blog-card__read">{post.read_time} read</span>
                                    </div>

                                    <h2 className="blog-card__title">{post.title}</h2>
                                    <p className="blog-card__excerpt">{post.excerpt}</p>

                                    <div className="blog-card__footer">
                                        <div className="blog-card__tags">
                                            {post.tags.map(t => (
                                                <span key={t} className="cyber-badge">{t}</span>
                                            ))}
                                        </div>
                                        <span className="blog-card__cta neon-text">Read more →</span>
                                    </div>
                                </Link>
                            </motion.article>
                        ))}
                    </div>

                </div>
            </section>
        </main>
    )
}
