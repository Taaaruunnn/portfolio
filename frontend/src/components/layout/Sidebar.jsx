import './Sidebar.css'

/**
 * Sidebar — Collapsible side panel for Lab and SecureAI pages.
 * Props:
 *   isOpen    {boolean} — controlled open state
 *   onClose   {fn}      — close callback
 *   title     {string}
 *   children  {ReactNode}
 */
export default function Sidebar({ isOpen, onClose, title = 'Panel', children }) {
    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="sidebar__backdrop"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}
                aria-label={title}
                aria-hidden={!isOpen}
            >
                <div className="sidebar__header">
                    <h2 className="sidebar__title">{title}</h2>
                    <button
                        className="sidebar__close"
                        onClick={onClose}
                        aria-label="Close panel"
                    >
                        ✕
                    </button>
                </div>
                <div className="sidebar__content">
                    {children}
                </div>
            </aside>
        </>
    )
}
