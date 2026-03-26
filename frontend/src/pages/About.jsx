import TimelineItem from '@/components/ui/TimelineItem'
import './About.css'

const TIMELINE = [
    {
        date: "Aug' 23 – Present",
        title: 'B.Tech Computer Science & Engineering',
        org: 'Lovely Professional University, Punjab, India',
        description: 'CGPA: 7.0. Focus on systems programming, cryptography, and cybersecurity. Active CTF competitor.',
        tags: ['computer-science', 'cryptography', 'CTF', 'C', 'Assembly'],
    },
    {
        date: "Apr' 21 – Mar' 22",
        title: 'Intermediate',
        org: 'Jawahar Navodaya Vidyalaya, Jammu, J&K',
        description: 'Percentage: 78%',
        tags: ['intermediate', 'science'],
    },
    {
        date: "Apr' 19 – Mar' 20",
        title: 'Matriculation',
        org: 'Jawahar Navodaya Vidyalaya, Jammu, J&K',
        description: 'Percentage: 88.5%',
        tags: ['matriculation'],
        isLast: true,
    },
]

const FOCUS = [
    { icon: '🔐', label: 'Binary Exploitation', desc: 'Stack/heap overflows, ROP chains, shellcoding' },
    { icon: '🌐', label: 'Web Security', desc: 'OWASP Top 10, API security, OAuth flaws' },
    { icon: '🤖', label: 'AI Security', desc: 'Prompt injection, RAG pipeline hardening' },
    { icon: '🔬', label: 'Malware Analysis', desc: 'Static & dynamic analysis, IDA Pro, Ghidra' },
]

export default function About() {
    return (
        <main className="page-content">

            {/* ── Hero ─────────────────────────────────────────────── */}
            <section className="section about-hero">
                <div className="container about-hero__inner">
                    <div className="animate-fade-up">
                        <p className="section-label">About Me</p>
                        <h1 className="section-title" style={{ marginBottom: 'var(--space-5)' }}>
                            Security <span className="gradient-text">Engineer</span>
                            <br />& Researcher
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: '55ch', marginBottom: 'var(--space-6)' }}>
                            I've spent years building and breaking security systems — from writing exploits for
                            CTF challenges to hardening enterprise infrastructure. I believe the best defenders
                            think like attackers.
                        </p>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, maxWidth: '55ch' }}>
                            This portfolio is both a showcase and a working lab — live tools, writeups, and an
                            AI assistant that knows my research. Everything here was built with security-first
                            engineering principles.
                        </p>
                    </div>

                    {/* Terminal bio */}
                    <div className="terminal-box animate-fade-up delay-300" style={{ minHeight: '200px' }}>
                        <div className="hero__term-line hero__term-cmd">cat about.txt</div>
                        <div style={{ color: 'var(--text-muted)', lineHeight: 1.9, fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)' }}>
                            <div>name: <span style={{ color: 'var(--accent-green)' }}>Tarun Singh</span></div>
                            <div>speciality: <span style={{ color: 'var(--accent-blue)' }}>Penetration Testing</span></div>
                            <div>tools: <span style={{ color: 'var(--text-secondary)' }}>gdb, pwndbg, burpsuite, ghidra</span></div>
                            <div>languages: <span style={{ color: 'var(--text-secondary)' }}>python, c, assembly, java, bash</span></div>
                            <div>certs: <span style={{ color: 'var(--text-secondary)' }}>OSCP (in progress)</span></div>
                            <div>ctf: <span style={{ color: 'var(--accent-green)' }}>active competitor</span></div>
                            <div>coffee: <span style={{ color: 'var(--accent-orange)' }}>∞ cups/day</span></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Timeline ─────────────────────────────────────────── */}
            <section className="section">
                <div className="container">
                    <div className="section-header animate-fade-up">
                        <p className="section-label">Journey</p>
                        <h2 className="section-title">Experience & Education</h2>
                    </div>
                    <div style={{ maxWidth: '680px' }}>
                        {TIMELINE.map((item) => (
                            <TimelineItem key={item.title} {...item} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Current Focus ────────────────────────────────────── */}
            <section className="section" style={{ background: 'var(--bg-secondary)' }}>
                <div className="container">
                    <div className="section-header animate-fade-up">
                        <p className="section-label">Right Now</p>
                        <h2 className="section-title">Current Focus Areas</h2>
                    </div>
                    <div className="grid-cards">
                        {FOCUS.map(({ icon, label, desc }, i) => (
                            <div key={label} className={`glass-card about-focus-card animate-fade-up delay-${(i + 1) * 100}`}>
                                <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-3)' }}>{icon}</div>
                                <h3 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semi)', marginBottom: 'var(--space-2)' }}>{label}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </main>
    )
}
