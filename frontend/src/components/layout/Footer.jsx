import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import './Footer.css'

const FOOTER_LINKS = [
    { href: 'https://github.com/Taaaruunnn', label: 'GitHub' },
    { href: 'https://www.linkedin.com/in/taaaruunnn', label: 'LinkedIn' },
]

const NAV_LINKS = [
    { to: '/projects', label: 'Projects' },
    { to: '/blog', label: 'Blog' },
    { to: '/lab', label: 'Lab' },
    { to: '/secure-ai', label: 'SecureAI' },
    { to: '/about', label: 'About' },
]

export default function Footer() {
    const footerRef = useRef(null)
    const { scrollYProgress } = useScroll({
        target: footerRef,
        offset: ["start end", "end end"]
    })

    // Slide the massive "2025" upwards as you scroll to the end of the page
    const yYear = useTransform(scrollYProgress, [0, 1], ["50%", "25%"])

    return (
        <footer className="footer" role="contentinfo" ref={footerRef}>
            <div className="footer__inner container">

                <div className="footer-content-layer">
                    <div className="footer__grid">
                        {/* Brand */}
                        <div className="footer__brand">
                            <Link to="/" className="footer__logo">
                                <span className="footer__logo-icon">{'</>'}</span>
                                <span>cybersec<span className="gradient-text">.port</span></span>
                            </Link>
                            <p className="footer__tagline">
                                Building secure systems · Breaking insecure ones
                            </p>
                            <div className="footer__social">
                                {FOOTER_LINKS.map(({ href, label }) => (
                                    <a
                                        key={label}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="footer__social-link"
                                        aria-label={label}
                                    >
                                        {label}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="footer__nav" aria-label="Footer navigation">
                            <h3 className="footer__nav-title">Navigation</h3>
                            {NAV_LINKS.map(({ to, label }) => (
                                <Link key={to} to={to} className="footer__nav-link">
                                    {label}
                                </Link>
                            ))}
                        </nav>

                        {/* Status */}
                        <div className="footer__status">
                            <h3 className="footer__nav-title">System</h3>
                            <div className="footer__status-item">
                                <span className="status-dot" />
                                <span>API Online</span>
                            </div>
                        </div>
                    </div>

                    <div className="footer__bottom">
                        <p className="footer__copy">
                            © {new Date().getFullYear()} CyberSec Portfolio · Built with Flask + React
                        </p>
                        <p className="footer__mono">
                            <span className="neon-text" style={{ fontSize: 'var(--text-xs)' }}>
                                [ security first. always. ]
                            </span>
                        </p>
                    </div>
                </div>

                {/* Massive Animated Background Year */}
                <div className="footer__huge-year-mask">
                    <motion.div style={{ y: yYear }} className="footer__huge-year">
                        2026
                    </motion.div>
                </div>

            </div>
        </footer>
    )
}
