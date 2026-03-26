import './Projects.css'

const PROJECTS = [
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

                    <div className="projects__grid">
                        {PROJECTS.map((p, i) => (
                            <div key={p.id} className={`glass-card project-card animate-fade-up delay-${(i + 1) * 100}`}>
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
                                <div className="project-card__links">
                                    <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="project-card__link">
                                        <span className="project-card__link-icon">⟶</span> View on GitHub
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Coming soon placeholder */}
                    <div className="projects__coming-soon animate-fade-up delay-400">
                        <div className="terminal-box">
                            <p className="projects__soon-text">
                                <span className="projects__soon-cursor">▌</span> More projects coming soon — stay tuned.
                            </p>
                        </div>
                    </div>

                </div>
            </section>
        </main>
    )
}
