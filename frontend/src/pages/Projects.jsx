import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './Projects.css'

const PROJECTS = [
    {
        id: 'madad-karo',
        title: 'Madad Karo Foundation',
        date: 'Mar 2026',
        preview: {
            heading: 'Features',
            items: ['Donor Management', 'Volunteer Registration', 'Event Coordination', 'Community Outreach'],
        },
        bullets: [
            'Built a full-stack web platform for a charitable foundation connecting donors and volunteers to social causes.',
            'Designed streamlined workflows for donation processing, volunteer sign-ups, and real-time community messaging.',
            'Applied responsive design principles for accessibility across devices, targeting rural and mobile-first audiences.',
        ],
        tech: ['HTML/CSS', 'JavaScript', 'Full-Stack'],
        github_url: 'https://github.com/Taaaruunnn/Madad-Kar-Foundation/tree/main/madad%20kar%20foundation',
    },
    {
        id: 'watchdog',
        title: 'WatchDog',
        date: 'Feb 2025',
        preview: {
            heading: 'Monitors',
            items: ['Process Activity', 'Network Connections', 'Suspicious Behaviour', 'Privilege Escalation'],
        },
        bullets: [
            'Developed a real-time system monitoring and security watchdog tool tracking processes, network connections, and suspicious host activity.',
            'Structured alerts to flag anomalous outbound connections and high-privilege process spawns for targeted manual investigation.',
            'Tested on live environments to validate detection of common attack patterns and post-exploitation indicators.',
        ],
        tech: ['Python', 'Security', 'Monitoring'],
        github_url: 'https://github.com/Taaaruunnn/WatchDog',
    },
]

const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: i => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.2, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
}

const modalVariants = {
    hidden: { opacity: 0, scale: 0.85, y: 30 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 22, stiffness: 260 } },
    exit: { opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } },
}

export default function Projects() {
    const [selected, setSelected] = useState(null)

    return (
        <main className="page-content">
            <section className="section">
                <div className="container">

                    {/* ── Header ──────────────────────────── */}
                    <motion.div
                        className="projects__header"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="projects__title">Projects</h1>
                        <div className="projects__title-line" />
                    </motion.div>

                    {/* ── Cards Grid ──────────────────────── */}
                    <div className="projects__grid">
                        {PROJECTS.map((p, i) => (
                            <motion.div
                                key={p.id}
                                className="op-card"
                                custom={i}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.2 }}
                                variants={cardVariants}
                                whileHover={{ scale: 1.015, transition: { duration: 0.3 } }}
                                onClick={() => window.open(p.github_url, '_blank')}
                                style={{ cursor: 'pointer' }}
                            >
                                {/* Terminal preview */}
                                <div className="op-card__preview">
                                    <div className="op-card__preview-dots">
                                        <span /><span /><span />
                                    </div>
                                    <div className="op-card__preview-body">
                                        <div className="op-card__preview-heading">{p.preview.heading}</div>
                                        <ul className="op-card__preview-list">
                                            {p.preview.items.map(item => (
                                                <li key={item}>
                                                    <span className="op-card__preview-icon">▸</span> {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Card content */}
                                <div className="op-card__content">
                                    <div className="op-card__top-row">
                                        <h2 className="op-card__name">{p.title}</h2>
                                        <a
                                            href={p.github_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="op-card__ext-link"
                                            onClick={e => e.stopPropagation()}
                                            aria-label="Open on GitHub"
                                        >
                                            ↗
                                        </a>
                                    </div>

                                    <div className="op-card__date">{p.date}</div>

                                    <ul className="op-card__bullets">
                                        {p.bullets.map((b, bi) => (
                                            <li key={bi}>
                                                <span className="op-card__bullet-chevron">›</span>
                                                <span>{b}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="op-card__tech-row">
                                        <span className="op-card__tech-label">TECH:</span>
                                        <div className="op-card__tech-badges">
                                            {p.tech.map(t => (
                                                <span key={t} className="op-card__tech-badge">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Coming soon */}
                    <motion.div
                        className="projects__coming-soon"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                    >
                        <div className="terminal-box">
                            <p className="projects__soon-text">
                                <span className="projects__soon-cursor">▌</span> More operations incoming — stay tuned.
                            </p>
                        </div>
                    </motion.div>

                </div>
            </section>

            {/* ── Detail Modal ────────────────────────── */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        className="project-modal__overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelected(null)}
                    >
                        <motion.div
                            className="project-modal"
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={e => e.stopPropagation()}
                        >
                            <button className="project-modal__close" onClick={() => setSelected(null)}>✕</button>
                            <span className="project-modal__badge">PROJECT</span>
                            <h2 className="project-modal__title">{selected.title}</h2>
                            <ul className="project-modal__bullets">
                                {selected.bullets.map((b, i) => <li key={i}>{b}</li>)}
                            </ul>
                            <div className="project-modal__tags">
                                {selected.tech.map(t => (
                                    <span key={t} className="op-card__tech-badge">{t}</span>
                                ))}
                            </div>
                            <a
                                href={selected.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="project-modal__link"
                            >
                                ⟶ Explore Code on GitHub
                            </a>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    )
}
