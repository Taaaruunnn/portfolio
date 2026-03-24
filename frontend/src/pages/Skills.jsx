import { useEffect, useRef } from 'react'
import './Skills.css'

const CATEGORIES = [
    {
        id: 'offensive',
        label: '⚔️ Offensive',
        skills: [
            { name: 'Buffer Overflow / ROP', level: 0 },
            { name: 'Web Exploitation', level: 0 },
            { name: 'Reverse Engineering', level: 0 },
            { name: 'Social Engineering', level: 0 },
            { name: 'CTF Challenges', level: 0 },
        ],
    },
    {
        id: 'defensive',
        label: '🛡 Defensive',
        skills: [
            { name: 'Incident Response', level: 0 },
            { name: 'Threat Hunting', level: 0 },
            { name: 'SIEM / Log Analysis', level: 0 },
            { name: 'Malware Analysis', level: 0 },
            { name: 'Hardening & SSDLC', level: 0 },
        ],
    },
    {
        id: 'tools',
        label: '🔧 Tools',
        skills: [
            { name: 'GDB + pwndbg', level: 0 },
            { name: 'Burp Suite', level: 0 },
            { name: 'Ghidra / IDA', level: 0 },
            { name: 'Metasploit', level: 0 },
            { name: 'Wireshark / tcpdump', level: 0 },
        ],
    },
    {
        id: 'languages',
        label: '</> Languages',
        skills: [
            { name: 'Python', level: 0 },
            { name: 'C / C++', level: 0 },
            { name: 'x86-64 Asm', level: 0 },
            { name: 'Java', level: 0 },
            { name: 'Bash', level: 0 },
        ],
    },
]

const CERTS = [
    { name: 'OSCP', status: 'Planned', color: 'var(--accent-orange)' },
    { name: 'CEH', status: 'In Progress', color: 'var(--accent-green)' },
    { name: 'CompTIA Sec+', status: 'In Progress', color: 'var(--accent-green)' },
    { name: 'CRTO', status: 'Planned', color: 'var(--text-muted)' },
]

function SkillBar({ name, level }) {
    const barRef = useRef(null)

    useEffect(() => {
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    barRef.current?.style.setProperty('--progress-target', `${level}%`)
                    barRef.current?.classList.add('skills__bar--animate')
                    obs.disconnect()
                }
            },
            { threshold: 0.4 }
        )
        if (barRef.current) obs.observe(barRef.current)
        return () => obs.disconnect()
    }, [level])

    return (
        <div className="skills__skill">
            <div className="skills__skill-meta">
                <span className="skills__skill-name">{name}</span>
                <span className="skills__skill-pct neon-text">{level}%</span>
            </div>
            <div className="skills__bar-track">
                <div ref={barRef} className="skills__bar" style={{ '--progress-target': '0%' }} />
            </div>
        </div>
    )
}

export default function Skills() {
    return (
        <main className="page-content">
            <section className="section">
                <div className="container">
                    <div className="section-header animate-fade-up">
                        <p className="section-label">Capabilities</p>
                        <h1 className="section-title">Skills & Expertise</h1>
                        <p className="section-subtitle">
                            Offensive security specialist with broad defensive tooling experience.
                        </p>
                    </div>

                    {/* Skill grids */}
                    <div className="skills__grid">
                        {CATEGORIES.map((cat, ci) => (
                            <div key={cat.id} className={`glass-card skills__category animate-fade-up delay-${(ci + 1) * 100}`}>
                                <h2 className="skills__cat-title">{cat.label}</h2>
                                {cat.skills.map((s) => (
                                    <SkillBar key={s.name} name={s.name} level={s.level} />
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Certifications */}
                    <div className="section-header animate-fade-up" style={{ marginTop: 'var(--space-16)' }}>
                        <p className="section-label">Credentials</p>
                        <h2 className="section-title">Certifications</h2>
                    </div>
                    <div className="skills__certs">
                        {CERTS.map((c) => (
                            <div key={c.name} className="glass-card skills__cert-card">
                                <span className="skills__cert-name">{c.name}</span>
                                <span className="skills__cert-status" style={{ color: c.color }}>
                                    {c.status}
                                </span>
                            </div>
                        ))}
                    </div>

                </div>
            </section>
        </main>
    )
}
