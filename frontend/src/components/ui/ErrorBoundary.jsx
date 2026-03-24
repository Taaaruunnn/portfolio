import { Component } from 'react'
import './ErrorBoundary.css'

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info.componentStack)
    }

    handleReset = () => this.setState({ hasError: false, error: null })

    render() {
        if (!this.state.hasError) return this.props.children

        return (
            <main className="page-content eb__page">
                <div className="terminal-box eb__box">
                    <div className="eb__header">
                        <span className="eb__sig">SIGSEGV</span>
                        <span className="eb__code">11</span>
                    </div>
                    <p className="eb__title">Segmentation fault (core dumped)</p>
                    <p className="eb__msg">
                        An unhandled render error crashed this page component.
                        The rest of the application is still running.
                    </p>
                    {this.state.error && (
                        <pre className="eb__trace">
                            {this.state.error.message}
                        </pre>
                    )}
                    <div className="eb__actions">
                        <button className="cyber-btn" onClick={this.handleReset}>
                            ↩ Retry
                        </button>
                        <a href="/" className="cyber-btn cyber-btn--outline">
                            ← Home
                        </a>
                    </div>
                </div>
            </main>
        )
    }
}
