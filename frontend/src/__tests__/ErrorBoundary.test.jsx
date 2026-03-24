/**
 * src/__tests__/ErrorBoundary.test.jsx
 * ─────────────────────────────────────
 * Tests for the ErrorBoundary component.
 *
 * Strategy: render a component that throws on demand,
 * toggle a prop to control when the error fires.
 * Suppress expected console.error output via beforeEach spy.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

// Helper: component that throws when shouldThrow=true
function Bomb({ shouldThrow }) {
    if (shouldThrow) throw new Error('Test explosion!')
    return <div>All clear</div>
}

// Wrapper: ErrorBoundary needs MemoryRouter for the Home link
function wrap(children) {
    return <MemoryRouter>{children}</MemoryRouter>
}

describe('ErrorBoundary', () => {
    let errorSpy

    beforeEach(() => {
        // Suppress jsdom's unhandled error console noise
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })
    })

    afterEach(() => {
        errorSpy.mockRestore()
    })

    it('renders children when no error occurs', () => {
        render(wrap(
            <ErrorBoundary>
                <Bomb shouldThrow={false} />
            </ErrorBoundary>
        ))
        expect(screen.getByText('All clear')).toBeInTheDocument()
    })

    it('catches a render error and shows the SIGSEGV screen', () => {
        render(wrap(
            <ErrorBoundary>
                <Bomb shouldThrow={true} />
            </ErrorBoundary>
        ))
        expect(screen.getByText('SIGSEGV')).toBeInTheDocument()
    })

    it('shows the thrown error message in the trace block', () => {
        render(wrap(
            <ErrorBoundary>
                <Bomb shouldThrow={true} />
            </ErrorBoundary>
        ))
        expect(screen.getByText(/Test explosion!/i)).toBeInTheDocument()
    })

    it('shows a "Retry" button on the crash screen', () => {
        render(wrap(
            <ErrorBoundary>
                <Bomb shouldThrow={true} />
            </ErrorBoundary>
        ))
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('Home link is present on crash screen', () => {
        render(wrap(
            <ErrorBoundary>
                <Bomb shouldThrow={true} />
            </ErrorBoundary>
        ))
        const homeLink = screen.getByRole('link', { name: /home/i })
        expect(homeLink).toBeInTheDocument()
        expect(homeLink).toHaveAttribute('href', '/')
    })
})
