import { useState, useCallback } from 'react'
import { runSimulation } from '@/services/api'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
    MemoryTable,
    RegisterFile,
    StackSlice,
    ChainProgress,
    HeapTable,
} from '@/components/lab/MemoryVisualizer'
import './LiveLab.css'

// ── Config ────────────────────────────────────────────────────────
const SIMS = [
    {
        id: 'stack',
        label: 'Stack BOF',
        icon: '🧱',
        desc: 'Step through a 5-stage buffer overflow attack on a fictional x86-64 stack. Watch canary detection and saved_rip hijacking.',
        ctrl: 'step',     // integer stepper
        total: 5,
    },
    {
        id: 'heap',
        label: 'Heap Viz',
        icon: '🗂',
        desc: 'Explore ptmalloc2-style heap behaviour: chunk allocation, free/bin insertion, heap spray, and use-after-free corruption.',
        ctrl: 'phase',    // tab selector
        phases: ['alloc', 'free', 'spray', 'uaf'],
    },
    {
        id: 'rop',
        label: 'ROP Chain',
        icon: '⛓',
        desc: 'Walk through a 6-gadget ret2libc ROP chain targeting execve("/bin/sh"). Observe register and stack state at each gadget.',
        ctrl: 'step',
        total: 6,
    },
]

const STAGE_COLORS = {
    setup: 'var(--text-muted)',
    safe_write: 'var(--accent-green)',
    overflow_start: 'var(--accent-orange)',
    canary_broken: '#ff4444',
    rip_hijacked: '#ff0000',
}

// ── Component ─────────────────────────────────────────────────────
export default function LiveLab() {
    const [activeId, setActiveId] = useState('stack')
    const [step, setStep] = useState(1)
    const [phase, setPhase] = useState('alloc')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [started, setStarted] = useState(false)

    const sim = SIMS.find(s => s.id === activeId)

    const fetchStep = useCallback(async (simId, stepVal, phaseVal) => {
        setLoading(true)
        setError(null)
        try {
            const params = simId === 'heap' ? { phase: phaseVal } : { step: stepVal }
            const res = await runSimulation(simId, params)
            setData(res.data)
            setStarted(true)
        } catch (err) {
            setError(
                err?.type === 'network'
                    ? 'Backend offline — start Flask on :5000.'
                    : err?.message || 'Simulation engine error.'
            )
        } finally {
            setLoading(false)
        }
    }, [])

    const handleStart = () => fetchStep(activeId, step, phase)

    const handleNext = () => {
        if (sim.ctrl === 'step') {
            const next = Math.min(step + 1, sim.total)
            setStep(next)
            fetchStep(activeId, next, phase)
        }
    }

    const handlePrev = () => {
        if (sim.ctrl === 'step') {
            const prev = Math.max(step - 1, 1)
            setStep(prev)
            fetchStep(activeId, prev, phase)
        }
    }

    const handlePhase = (p) => {
        setPhase(p)
        fetchStep(activeId, step, p)
    }

    const handleTabSwitch = (id) => {
        setActiveId(id)
        setStep(1)
        setPhase('alloc')
        setData(null)
        setStarted(false)
        setError(null)
    }

    const stageColor = data?.exploit_stage ? STAGE_COLORS[data.exploit_stage] : null

    return (
        <main className="page-content">
            <section className="section">
                <div className="container livelab__container">

                    <div className="section-header animate-fade-up">
                        <p className="section-label">Interactive Lab</p>
                        <h1 className="section-title">LiveLab</h1>
                        <p className="section-subtitle">
                            Browser-accessible binary exploitation simulations powered by Java 25.
                            Educational — all data is synthetic.
                        </p>
                    </div>

                    {/* Simulation tabs */}
                    <div className="livelab__tabs animate-fade-up delay-100">
                        {SIMS.map(s => (
                            <button
                                key={s.id}
                                className={`livelab__tab ${activeId === s.id ? 'livelab__tab--active' : ''}`}
                                onClick={() => handleTabSwitch(s.id)}
                            >
                                <span className="livelab__tab-icon">{s.icon}</span>
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* Description */}
                    <div className="glass-card livelab__desc animate-fade-up delay-150">
                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
                            {sim.desc}
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="livelab__controls animate-fade-up delay-200">

                        {/* Phase selector (heap only) */}
                        {sim.ctrl === 'phase' && (
                            <div className="livelab__phase-bar">
                                {sim.phases.map(p => (
                                    <button
                                        key={p}
                                        className={`livelab__phase-btn ${phase === p ? 'livelab__phase-btn--active' : ''}`}
                                        onClick={() => handlePhase(p)}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Step controls */}
                        {sim.ctrl === 'step' && (
                            <div className="livelab__step-row">
                                {!started ? (
                                    <button className="cyber-btn" onClick={handleStart} disabled={loading}>
                                        {loading ? 'Loading…' : '▶ Start Simulation'}
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            className="livelab__nav-btn"
                                            onClick={handlePrev}
                                            disabled={step <= 1 || loading}
                                        >← Prev</button>

                                        <span className="livelab__step-counter">
                                            Step {step} / {sim.total}
                                        </span>

                                        <button
                                            className="livelab__nav-btn livelab__nav-btn--next"
                                            onClick={handleNext}
                                            disabled={step >= sim.total || loading}
                                        >Next →</button>
                                    </>
                                )}

                                {/* Exploit stage badge */}
                                {data?.exploit_stage && (
                                    <span className="cyber-badge" style={{ color: stageColor, borderColor: stageColor, fontSize: '11px' }}>
                                        {data.exploit_stage.replace('_', ' ')}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Output panel */}
                    <div className="livelab__output glass-card animate-fade-up delay-250">

                        {!started && !loading && !error && (
                            <div className="livelab__idle">
                                <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                                    {sim.ctrl === 'step'
                                        ? '$ ./simulate --type=' + activeId + '  # press Start to begin'
                                        : '$ ./simulate --type=heap --phase=' + phase
                                    }
                                </p>
                            </div>
                        )}

                        {loading && <LoadingSpinner label="Running simulation…" size="sm" />}

                        {error && !loading && (
                            <p style={{ color: 'var(--accent-orange)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)' }}>
                                ✗ {error}
                            </p>
                        )}

                        {data && !loading && !error && (
                            <div className="livelab__result">
                                {/* Description */}
                                {data.description && (
                                    <div className="livelab__result-desc terminal-box" style={{ marginBottom: 'var(--space-5)' }}>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.7, fontFamily: 'var(--font-mono)' }}>
                                            {data.description}
                                        </p>
                                    </div>
                                )}

                                {/* Stack BOF: memory map + registers */}
                                {data.type === 'stack_bof' && (
                                    <>
                                        <MemoryTable rows={data.memory_map || []} />
                                        <RegisterFile registers={data.registers || {}} />
                                    </>
                                )}

                                {/* Heap: chunk table + bins */}
                                {data.type === 'heap_viz' && (
                                    <>
                                        <HeapTable chunks={data.chunks || []} />
                                        {data.bins && Object.keys(data.bins).length > 0 && (
                                            <div className="livelab__bins glass-card" style={{ padding: 'var(--space-4)' }}>
                                                <p className="mv__regs-title">Bin State</p>
                                                {Object.entries(data.bins).map(([bin, addrs]) => (
                                                    <div key={bin} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>{bin}: </span>
                                                        <span style={{ color: 'var(--accent-green)' }}>{addrs.join(' → ')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* ROP chain: current gadget + registers + stack + progress */}
                                {data.type === 'rop_chain' && (
                                    <div className="livelab__rop">
                                        <div className="livelab__rop-main">
                                            {/* Current gadget callout */}
                                            {data.current_gadget && (
                                                <div className="livelab__gadget-box">
                                                    <span className="livelab__gadget-addr">{data.current_gadget.address}</span>
                                                    <span className="livelab__gadget-instr">{data.current_gadget.instruction}</span>
                                                    <span className="livelab__gadget-effect">{data.current_gadget.effect}</span>
                                                </div>
                                            )}
                                            <RegisterFile registers={data.registers || {}} />
                                            <StackSlice stack={data.stack || []} />
                                        </div>
                                        <div className="livelab__rop-sidebar">
                                            <ChainProgress chain={data.chain_progress || []} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </section>
        </main>
    )
}
