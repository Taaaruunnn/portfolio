import { useEffect, useState } from 'react'

export default function CustomCursor() {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [hidden, setHidden] = useState(false)

    useEffect(() => {
        const addEventListeners = () => {
            document.addEventListener('mousemove', mMove)
            document.addEventListener('mouseenter', mEnter)
            document.addEventListener('mouseleave', mLeave)
        }

        const removeEventListeners = () => {
            document.removeEventListener('mousemove', mMove)
            document.removeEventListener('mouseenter', mEnter)
            document.removeEventListener('mouseleave', mLeave)
        }

        const mMove = (el) => {
            setPosition({ x: el.clientX, y: el.clientY })
        }

        const mEnter = () => {
            setHidden(false)
        }

        const mLeave = () => {
            setHidden(true)
        }

        addEventListeners()
        return () => removeEventListeners()
    }, [])

    return (
        <div
            className={`custom-cursor ${hidden ? 'hidden' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="cursor-icon"
            >
                {/* Retro pointer shape commonly seen in these portfolios */}
                <path
                    d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h8.21c.45 0 .67-.54.35-.85L5.5 3.21z"
                    fill="#000"
                    stroke="#fff"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    )
}
