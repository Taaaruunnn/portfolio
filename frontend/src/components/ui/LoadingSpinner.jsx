import './LoadingSpinner.css'

export default function LoadingSpinner({ label = 'Loading…', size = 'md' }) {
    return (
        <div className={`spinner spinner--${size}`} aria-label={label} role="status">
            <div className="spinner__ring" />
            <div className="spinner__ring spinner__ring--2" />
            <span className="spinner__label">{label}</span>
        </div>
    )
}
