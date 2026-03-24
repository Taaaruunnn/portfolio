import './GlassCard.css'

/**
 * GlassCard — Premium glassmorphism card component.
 *
 * Props:
 *   title     {string}    — optional card header
 *   icon      {string}    — optional emoji/icon character
 *   children  {ReactNode}
 *   className {string}    — extra CSS classes
 *   onClick   {fn}        — makes card interactive
 *   href      {string}    — wraps in anchor if provided
 *   variant   {'default'|'blue'|'purple'} — glow color
 */
export default function GlassCard({
    title,
    icon,
    children,
    className = '',
    onClick,
    href,
    variant = 'default',
}) {
    const Tag = href ? 'a' : onClick ? 'button' : 'div'
    const role = onClick && !href ? 'button' : undefined

    const variantClass = variant !== 'default' ? `glass-card-${variant}` : ''

    return (
        <Tag
            className={`glass-card glass-card-comp ${variantClass} ${className}`}
            href={href}
            onClick={onClick}
            role={role}
            target={href ? '_blank' : undefined}
            rel={href ? 'noopener noreferrer' : undefined}
        >
            {(icon || title) && (
                <div className="glass-card__header">
                    {icon && <span className="glass-card__icon" aria-hidden="true">{icon}</span>}
                    {title && <h3 className="glass-card__title">{title}</h3>}
                </div>
            )}
            <div className="glass-card__body">
                {children}
            </div>
        </Tag>
    )
}
