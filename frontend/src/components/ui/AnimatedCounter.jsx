import { useEffect, useRef, useState } from 'react'
import './AnimatedCounter.css'

/**
 * AnimatedCounter — Counts from 0 to `target` on mount.
 * Uses requestAnimationFrame for smooth 60fps animation.
 *
 * Props:
 *   target   {number} — end value
 *   suffix   {string} — appended after number (e.g. '+', '%')
 *   label    {string} — label below number
 *   duration {number} — animation duration in ms (default: 2000)
 *   prefix   {string} — prepended before number (e.g. '$')
 */
export default function AnimatedCounter({
    target,
    suffix = '',
    prefix = '',
    label,
    duration = 2000,
}) {
    const [count, setCount] = useState(0)
    const [started, setStarted] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        // Trigger animation when element enters viewport
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStarted(true) },
            { threshold: 0.3 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!started) return

        let startTime = null
        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp
            const elapsed = timestamp - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Easing: ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(eased * target))
            if (progress < 1) requestAnimationFrame(animate)
        }
        const frame = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(frame)
    }, [started, target, duration])

    return (
        <div className="counter" ref={ref}>
            <div className="counter__value">
                <span className="counter__prefix">{prefix}</span>
                <span className="counter__number">{count.toLocaleString()}</span>
                <span className="counter__suffix">{suffix}</span>
            </div>
            {label && <p className="counter__label">{label}</p>}
        </div>
    )
}
