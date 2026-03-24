/**
 * src/__tests__/MemoryVisualizer.test.jsx
 * ────────────────────────────────────────
 * Unit tests for all 5 MemoryVisualizer sub-components.
 * Uses React Testing Library with jsdom environment.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
    MemoryTable,
    RegisterFile,
    HeapTable,
    StackSlice,
    ChainProgress,
} from '@/components/lab/MemoryVisualizer'

// ── Test data fixtures ─────────────────────────────────────────────

const STACK_ROWS = [
    { address: '0xffffd000', label: 'buf[0]', value: '0x0000000000000000', region: 'buffer', status: 'normal' },
    { address: '0xffffd010', label: 'buf[16]', value: '0x4141414141414141', region: 'buffer', status: 'overflow' },
    { address: '0xffffd020', label: 'canary', value: '0x4141414141414141', region: 'canary', status: 'broken' },
    { address: '0xffffd030', label: 'saved_rip', value: '0x41414141', region: 'ret', status: 'hijacked' },
]

const REGISTERS = { rip: '0x400e10', rsp: '0xffffd000', rbp: '0xffffd040' }

const HEAP_CHUNKS = [
    { address: '0x602000', label: 'A', size: 32, prev_size: 0, flags: 'PREV_INUSE', data: 'deadbeef', status: 'in_use' },
    { address: '0x602030', label: 'B', size: 32, prev_size: 0, flags: 'PREV_INUSE', data: '0xdeadbeef (fd corrupted)', status: 'corrupted' },
]

const STACK_SLICE = [
    { offset: '+0x00', value: '0x400f7e', label: 'pop rdi ; ret' },
    { offset: '+0x08', value: '0x400f82', label: 'pop rsi ; ret' },
]

const CHAIN = [
    { step: 1, done: true, current: false, gadget: 'pop rdi ; ret' },
    { step: 2, done: false, current: true, gadget: 'pop rsi ; ret' },
    { step: 3, done: false, current: false, gadget: 'syscall' },
]

// ── MemoryTable ────────────────────────────────────────────────────

describe('MemoryTable', () => {
    it('renders column headers', () => {
        render(<MemoryTable rows={STACK_ROWS} />)
        expect(screen.getByText('Address')).toBeInTheDocument()
        expect(screen.getByText('Label')).toBeInTheDocument()
        expect(screen.getByText('Value')).toBeInTheDocument()
        expect(screen.getByText('Status')).toBeInTheDocument()
    })

    it('renders address and label data', () => {
        render(<MemoryTable rows={STACK_ROWS} />)
        expect(screen.getByText('0xffffd000')).toBeInTheDocument()
        expect(screen.getByText('buf[0]')).toBeInTheDocument()
    })

    it('applies hijacked class on hijacked rows', () => {
        const { container } = render(<MemoryTable rows={STACK_ROWS} />)
        const hijackedRows = container.querySelectorAll('.mv__cell--hijacked')
        expect(hijackedRows.length).toBeGreaterThan(0)
    })

    it('applies overflow class on overflow rows', () => {
        const { container } = render(<MemoryTable rows={STACK_ROWS} />)
        const overflowRows = container.querySelectorAll('.mv__cell--overflow')
        expect(overflowRows.length).toBeGreaterThan(0)
    })

    it('returns null when rows is empty', () => {
        const { container } = render(<MemoryTable rows={[]} />)
        expect(container.firstChild).toBeNull()
    })
})

// ── RegisterFile ───────────────────────────────────────────────────

describe('RegisterFile', () => {
    it('renders register names and values', () => {
        render(<RegisterFile registers={REGISTERS} />)
        expect(screen.getByText('rip')).toBeInTheDocument()
        expect(screen.getByText('0x400e10')).toBeInTheDocument()
        expect(screen.getByText('rsp')).toBeInTheDocument()
    })

    it('renders a title label', () => {
        render(<RegisterFile registers={REGISTERS} />)
        expect(screen.getByText('Registers')).toBeInTheDocument()
    })

    it('returns null when registers is empty', () => {
        const { container } = render(<RegisterFile registers={{}} />)
        expect(container.firstChild).toBeNull()
    })
})

// ── HeapTable ─────────────────────────────────────────────────────

describe('HeapTable', () => {
    it('renders chunk address and label', () => {
        render(<HeapTable chunks={HEAP_CHUNKS} />)
        expect(screen.getByText('0x602000')).toBeInTheDocument()
        expect(screen.getByText('A')).toBeInTheDocument()
    })

    it('applies corrupted class for uaf chunk', () => {
        const { container } = render(<HeapTable chunks={HEAP_CHUNKS} />)
        const corruptedRows = container.querySelectorAll('.mv__cell--corrupted')
        expect(corruptedRows.length).toBeGreaterThan(0)
    })

    it('returns null when chunks is empty', () => {
        const { container } = render(<HeapTable chunks={[]} />)
        expect(container.firstChild).toBeNull()
    })
})

// ── StackSlice ─────────────────────────────────────────────────────

describe('StackSlice', () => {
    it('renders offset and value', () => {
        render(<StackSlice stack={STACK_SLICE} />)
        expect(screen.getByText('+0x00')).toBeInTheDocument()
        expect(screen.getByText('0x400f7e')).toBeInTheDocument()
    })

    it('renders the gadget label', () => {
        render(<StackSlice stack={STACK_SLICE} />)
        expect(screen.getByText('pop rdi ; ret')).toBeInTheDocument()
    })

    it('returns null for empty stack', () => {
        const { container } = render(<StackSlice stack={[]} />)
        expect(container.firstChild).toBeNull()
    })
})

// ── ChainProgress ──────────────────────────────────────────────────

describe('ChainProgress', () => {
    it('renders all chain items', () => {
        render(<ChainProgress chain={CHAIN} />)
        expect(screen.getByText('pop rdi ; ret')).toBeInTheDocument()
        expect(screen.getByText('syscall')).toBeInTheDocument()
    })

    it('applies current class to current step only', () => {
        const { container } = render(<ChainProgress chain={CHAIN} />)
        const currentItems = container.querySelectorAll('.mv__chain-item--current')
        expect(currentItems.length).toBe(1)
    })

    it('applies done class to completed steps', () => {
        const { container } = render(<ChainProgress chain={CHAIN} />)
        const doneItems = container.querySelectorAll('.mv__chain-item--done')
        expect(doneItems.length).toBe(1) // step 1 is done
    })

    it('returns null for empty chain', () => {
        const { container } = render(<ChainProgress chain={[]} />)
        expect(container.firstChild).toBeNull()
    })
})
