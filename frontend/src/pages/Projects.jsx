import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './Projects.css'

const PROJECTS = [
    {
        id: 'madad-karo',
        title: 'Madad Karo Foundation',
        description: 'A web platform for a charitable foundation that connects donors and volunteers to social causes. Built to streamline donations, volunteer sign-ups, and community outreach.',
        details: 'This full-stack platform was built to digitize the operations of a social impact foundation. It features donor management, volunteer registration, event coordination, and real-time community messaging — designed for accessibility and ease of use.',
        tags: ['web-dev', 'social-impact', 'full-stack'],
        github_url: 'https://github.com/Taaaruunnn/Madad-Kar-Foundation/tree/main/madad%20kar%20foundation',
    },
    {
        id: 'watchdog',
        title: 'WatchDog',
        description: 'A system monitoring and security watchdog tool that tracks processes, network connections, and suspicious activity on a host machine in real time.',
        details: 'WatchDog is a lightweight Python-based security tool designed for real-time host monitoring. It captures running processes, active network connections, and flags anomalous activity such as unknown outbound connections or high-privilege process spawns.',
        tags: ['security', 'monitoring', 'python'],
        github_url: 'https://github.com/Taaaruunnn/WatchDog',
    },
]

/* ── Card variants ─────────────────────────────────────────── */
const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: i => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.15, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
}

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
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

                    <motion.div
                        className="section-header"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <p className="section-label">Portfolio</p>
                        <h1 className="section-title">Projects</h1>
                        <p className="section-subtitle">
                            Research projects, CTF write-ups, and open-source tools.
                        </p>
                    </motion.div>

                    {/* ── Project Cards ─────────────────────────────── */}
                    <div className="projects__grid">
                        {PROJECTS.map((p, i) => (
                            <div key={p.id} className="projects__card-wrapper">
                                <motion.div
                                    className="project-card glass-card"
                                    custom={i}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true, amount: 0.3 }}
                                    variants={cardVariants}
                                    whileHover={{
                                        scale: 1.03,
                                        rotateX: -2,
                                        rotateY: 3,
                                        transition: { duration: 0.3 },
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelected(p)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="project-card__glow" />
                                    <div className="project-card__number">0{i + 1}</div>
                                    <div className="project-card__body">
                                        <h2 className="project-card__title">{p.title}</h2>
                                        <p className="project-card__desc">{p.description}</p>
                                        <div className="project-card__tags">
                                            {p.tags.map(t => (
                                                <span key={t} className="cyber-badge">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="project-card__hint">
                                        <span>Click to expand</span>
                                        <span className="project-card__hint-icon">↗</span>
                                    </div>
                                </motion.div>

                                {/* CTA button OUTSIDE the card */}
                                <motion.a
                                    href={p.github_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="project-card__cta"
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.15 + 0.3, duration: 0.4 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <span className="project-card__cta-arrow">⟶</span>
                                    Explore Code
                                </motion.a>
                            </div>
                        ))}
                    </div>

                    {/* Coming soon */}
                    <motion.div
                        className="projects__coming-soon"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                    >
                        <div className="terminal-box">
                            <p className="projects__soon-text">
                                <span className="projects__soon-cursor">▌</span> More projects coming soon — stay tuned.
                            </p>
                        </div>
                    </motion.div>

                </div>
            </section>

            {/* ── Expand Modal ──────────────────────────────── */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        className="project-modal__overlay"
                        variants={overlayVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
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
                            <div className="project-modal__header">
                                <span className="project-modal__badge">PROJECT</span>
                                <h2 className="project-modal__title">{selected.title}</h2>
                            </div>
                            <p className="project-modal__desc">{selected.details || selected.description}</p>
                            <div className="project-modal__tags">
                                {selected.tags.map(t => (
                                    <span key={t} className="cyber-badge">{t}</span>
                                ))}
                            </div>
                            <a
                                href={selected.github_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="project-modal__link"
                            >
                                <span>⟶</span> Explore Code on GitHub
                            </a>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    )
}
