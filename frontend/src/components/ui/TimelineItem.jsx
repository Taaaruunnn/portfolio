import './TimelineItem.css'

/**
 * TimelineItem — Vertical timeline entry.
 *
 * Props:
 *   date        {string}
 *   title       {string}
 *   org         {string} — company / institution
 *   description {string}
 *   tags        {string[]}
 *   isLast      {boolean} — omits connecting line
 */
export default function TimelineItem({ date, title, org, description, tags = [], isLast }) {
    return (
        <div className={`timeline-item ${isLast ? 'timeline-item--last' : ''}`}>
            {/* Spine */}
            <div className="timeline-item__spine">
                <div className="timeline-item__dot" aria-hidden="true" />
                {!isLast && <div className="timeline-item__line" aria-hidden="true" />}
            </div>

            {/* Content */}
            <div className="timeline-item__content glass-card" style={{ padding: 'var(--space-5)' }}>
                <div className="timeline-item__meta">
                    <time className="timeline-item__date" dateTime={date}>{date}</time>
                    {org && <span className="timeline-item__org">{org}</span>}
                </div>
                <h3 className="timeline-item__title">{title}</h3>
                {description && (
                    <p className="timeline-item__desc">{description}</p>
                )}
                {tags.length > 0 && (
                    <div className="timeline-item__tags">
                        {tags.map((tag) => (
                            <span key={tag} className="cyber-badge">{tag}</span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
