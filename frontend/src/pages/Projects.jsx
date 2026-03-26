import { useState, useEffect } from 'react'
import { getProjects } from '@/services/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import './Projects.css'

const ALL_TAG = 'all'

const FEATURED_PROJECTS = [
    {
        id: 'madad-karo',
        title: 'Madad Karo Foundation',
        description: 'A web platform for a charitable foundation that connects donors and volunteers to social causes. Built to streamline donations, volunteer sign-ups, and community outreach.',
        tags: ['web-dev', 'social-impact', 'full-stack'],
        github_url: 'https://github.com/Taaaruunnn/Madad-Kar-Foundation/tree/main/madad%20kar%20foundation',
    },
    {
        id: 'watchdog',
        title: 'WatchDog',
        description: 'A system monitoring and security watchdog tool that tracks processes, network connections, and suspicious activity on a host machine in real time.',
        tags: ['security', 'monitoring', 'python'],
        github_url: 'https://github.com/Taaaruunnn/WatchDog',
    },
]

export default function Projects() {
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [active, setActive] = useState(ALL_TAG)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(null)

        getProjects()
            .then(res => {
                if (!cancelled) {
                    setProjects(res.data.items || [])
                }
            })
            .catch(err => {
                if (!cancelled) {
                    setError(
                        err?.type === 'network'
                            ? 'Backend offline — start the Flask server on :5000.'
                            : err?.message || 'Failed to load projects.'
                    )
                }
            })
            .finally(() => { if (!cancelled) setLoading(false) })

        return () => { cancelled = true }
    }, [])

    // Build tag list from live data
    const allTags = [ALL_TAG, ...new Set(projects.flatMap(p => p.tags || []))]

    const filtered =
        active === ALL_TAG
            ? projects
            : projects.filter(p => (p.tags || []).includes(active))

    return (
        <main className="page-content">
            <section className="section">
                <div className="container">

                    <div className="section-header animate-fade-up">
                        <p className="section-label">Portfolio</p>
                        <h1 className="section-title">Projects</h1>
                        <p className="section-subtitle">
                            Research projects, CTF write-ups, and open-source tools.
                        </p>
                    </div>

                    {/* Featured Projects (always visible) */}
                    <div className="grid-cards" style={{ marginBottom: 'var(--space-8)' }}>
                        {FEATURED_PROJECTS.map((p, i) => (
                            <div key={p.id} className={`glass-card project-card animate-fade-up delay-${(i + 1) * 100}`}>
                                <div className="project-card__body">
                                    <h2 className="project-card__title">{p.title}</h2>
                                    <p className="project-card__desc">{p.description}</p>
                                    <div className="project-card__tags">
                                        {p.tags.map(t => (
                                            <span key={t} className="cyber-badge">{t}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="project-card__links">
                                    <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="project-card__link">
                                        GitHub →
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Loading */}
                    {loading && <LoadingSpinner label="Loading projects…" />}

                    {/* Error / Offline */}
                    {error && !loading && (
                        <div className="terminal-box projects__offline animate-fade-up">
                            <p style={{ color: 'var(--accent-orange)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                                ✗ {error}
                            </p>
                        </div>
                    )}

                    {/* Content */}
                    {!loading && !error && (
                        <>
                            {/* Tag filter bar */}
                            <div className="projects__filters animate-fade-up">
                                {allTags.map(tag => (
                                    <button
                                        key={tag}
                                        className={`projects__filter-btn ${active === tag ? 'projects__filter-btn--active' : ''}`}
                                        onClick={() => setActive(tag)}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>

                            {filtered.length === 0 ? (
                                <div className="terminal-box animate-fade-up">
                                    <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                                        {projects.length === 0
                                            ? '$ ls projects/ → (empty) — add projects via the admin API'
                                            : `$ filter --tag="${active}" → 0 results`
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="grid-cards">
                                    {filtered.map((p, i) => (
                                        <div key={p.id} className={`glass-card project-card animate-fade-up delay-${Math.min((i + 1) * 100, 500)}`}>
                                            <div className="project-card__body">
                                                <h2 className="project-card__title">{p.title}</h2>
                                                <p className="project-card__desc">{p.description}</p>
                                                <div className="project-card__tags">
                                                    {(p.tags || []).map(t => (
                                                        <span key={t} className="cyber-badge">{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="project-card__links">
                                                {p.github_url && (
                                                    <a href="https://github.com/Taaaruunnn" target="_blank" rel="noopener noreferrer" className="project-card__link">
                                                        GitHub →
                                                    </a>
                                                )}
                                                {p.live_url && (
                                                    <a href={p.live_url} target="_blank" rel="noopener noreferrer" className="project-card__link project-card__link--live">
                                                        Live →
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                </div>
            </section>
        </main>
    )
}
