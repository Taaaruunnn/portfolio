import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Link } from 'react-router-dom'
import frogImg from '@/assets/frog2.png'
import virusImg from '@/assets/virus.png'
import './Home.css'

export default function Home() {
    const containerRef = useRef(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    })

    // Parallax logic: Background elements move slow, heavy text moves fast
    const yText = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"])
    const yClouds1 = useTransform(scrollYProgress, [0, 1], ["0%", "10%"])
    const yClouds2 = useTransform(scrollYProgress, [0, 1], ["0%", "5%"])

    return (
        <main className="home-wrapper" ref={containerRef}>

            {/* ── Parallax Hero Background ────────────────────────────────────────── */}
            <div className="home-background">
                {/* Replicated comic book pixel background grid via CSS */}
                <div className="bg-pixel-mesh"></div>

                {/* Parallax Clouds */}
                <motion.div style={{ y: yClouds1 }} className="cloud cloud-1" />
                <motion.div style={{ y: yClouds2 }} className="cloud cloud-2" />
                <motion.div style={{ y: yClouds2 }} className="cloud cloud-3" />
            </div>

            {/* ── Parallax Hero Content ───────────────────────────────────────────── */}
            <section className="hero-section">
                <div className="hero-top-label">
                    <span>✦</span> CYBERSECURITY PORTFOLIO OF <span>✦</span>
                </div>

                {/* Heavy display font (Anton) moving upwards via parallax */}
                <motion.div style={{ y: yText }} className="hero-massive-text">
                    <div className="hero-line hero-line-1">TARUN</div>
                    <div className="hero-line hero-line-2">SINGH</div>
                </motion.div>
            </section>

            {/* Floating Virus Images between Hero and Intro Card */}
            <div className="floating-viruses">
                <img src={virusImg} alt="Virus asset" className="virus virus-left" />
                <img src={virusImg} alt="Virus asset" className="virus virus-center" />
                <img src={virusImg} alt="Virus asset" className="virus virus-right" />
            </div>

            {/* ── Flip Card Introduction Section ──────────────────────────────────── */}
            <section className="intro-section">
                <div className="flip-card-container">
                    <div className="flip-card-inner">

                        {/* Front: ID Card Style */}
                        <div className="flip-card-front profile-id-card">
                            <div className="id-card-photo-wrapper">
                                <img src={frogImg} alt="Profile avatar" className="id-card-photo" />
                            </div>
                            <div className="id-card-info">
                                <h2 className="id-card-name">Tarun Singh</h2>
                                <p className="id-card-role">Security Engineer <br /><span><a href="mailto:tarun@example.com">tarun@example.com</a></span></p>
                                <p className="id-card-desc">
                                    I build secure systems, break insecure ones, and document everything. Specialized in binary exploitation, web penetration testing, and AI-assisted security research.
                                </p>
                                <p className="id-card-desc">
                                    I thrive on understanding system internals and embracing complex vulnerabilities with a proactive approach.
                                </p>
                            </div>
                            <div className="id-card-footer">
                                <div className="id-card-brand">cybersec<span>.port</span></div>
                                <div className="id-card-domain">Reverse Engineering & Exploit Dev</div>
                            </div>
                        </div>

                        {/* Back: "Read More" Style */}
                        <div className="flip-card-back about-cta-card">
                            <span className="about-cta-label">ABOUT</span>
                            <h3 className="about-cta-title">Read More</h3>
                            <div className="about-cta-icon" />
                            <Link to="/about" className="stretched-link" aria-label="Go to About page"></Link>
                        </div>

                    </div>
                </div>
                <div className="intro-footer-text">
                    Exploring digital systems & system internals through exploitation.
                </div>
            </section>

        </main>
    )
}
