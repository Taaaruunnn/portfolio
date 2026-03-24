import { useState, useEffect, useCallback } from 'react'
import { NavLink, Link } from 'react-router-dom'
import './Navbar.css'

const NAV_LINKS = [
    { to: '/', label: 'Home' },
    { to: '/projects', label: 'Projects' },
    { to: '/skills', label: 'Skills' },
    { to: '/blog', label: 'Blog' },
    { to: '/lab', label: 'Lab' },
    { to: '/about', label: 'About' },
]

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    const handleScroll = useCallback(() => {
        setScrolled(window.scrollY > 20)
    }, [])

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [handleScroll])

    // Close mobile menu on route change / Escape key
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [])

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [menuOpen])

    return (
        <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} role="banner">
            <div className="navbar__inner container">

                {/* ── Logo ── */}
                <Link to="/" className="navbar__logo" aria-label="Home">
                    <span className="navbar__logo-icon" aria-hidden="true">{'</>'}</span>
                    <span className="navbar__logo-text">cybersec<span className="gradient-text">.port</span></span>
                </Link>

                {/* ── Desktop Nav ── */}
                <nav className="navbar__links" aria-label="Primary navigation">
                    {NAV_LINKS.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                `navbar__link${isActive ? ' navbar__link--active' : ''}`
                            }
                        >
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* ── CTA ── */}
                <Link
                    to="/secure-ai"
                    className="cyber-btn navbar__cta"
                    aria-label="Ask SecureAI"
                >
                    SecureAI
                </Link>

                {/* ── Hamburger ── */}
                <button
                    className={`navbar__hamburger ${menuOpen ? 'is-open' : ''}`}
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    aria-expanded={menuOpen}
                    aria-controls="mobile-menu"
                >
                    <span />
                    <span />
                    <span />
                </button>
            </div>

            {/* ── Mobile Drawer ── */}
            <div
                id="mobile-menu"
                className={`navbar__mobile ${menuOpen ? 'navbar__mobile--open' : ''}`}
                aria-hidden={!menuOpen}
            >
                <nav aria-label="Mobile navigation">
                    {NAV_LINKS.map(({ to, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                `navbar__mobile-link${isActive ? ' navbar__mobile-link--active' : ''}`
                            }
                            onClick={() => setMenuOpen(false)}
                        >
                            {label}
                        </NavLink>
                    ))}
                    <Link
                        to="/secure-ai"
                        className="cyber-btn"
                        style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                        onClick={() => setMenuOpen(false)}
                    >
                        SecureAI
                    </Link>
                </nav>
            </div>

            {/* Mobile overlay backdrop */}
            {menuOpen && (
                <div
                    className="navbar__backdrop"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                />
            )}
        </header>
    )
}
