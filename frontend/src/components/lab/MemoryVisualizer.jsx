import './MemoryVisualizer.css'

const STATUS_LABELS = {
    normal: { icon: '●', clase: 'mv__cell--normal' },
    written: { icon: '✎', clase: 'mv__cell--written' },
    overflow: { icon: '⚠', clase: 'mv__cell--overflow' },
    intact: { icon: '🔒', clase: 'mv__cell--intact' },
    broken: { icon: '✗', clase: 'mv__cell--broken' },
    corrupted: { icon: '✗', clase: 'mv__cell--corrupted' },
    hijacked: { icon: '☠', clase: 'mv__cell--hijacked' },
    in_use: { icon: '●', clase: 'mv__cell--inuse' },
    freed: { icon: '○', clase: 'mv__cell--freed' },
    sprayed: { icon: '⚠', clase: 'mv__cell--overflow' },
    saved: { icon: '●', clase: 'mv__cell--normal' },
}

function statusMeta(status) {
    return STATUS_LABELS[status] || { icon: '?', clase: '' }
}

/** Stack/Heap/Generic memory cell table */
export function MemoryTable({ rows = [] }) {
    if (!rows.length) return null
    return (
        <div className="mv__table-wrap">
            <table className="mv__table">
                <thead>
                    <tr>
                        <th>Address</th>
                        <th>Label</th>
                        <th>Value</th>
                        <th>Region</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => {
                        const { icon, clase } = statusMeta(row.status)
                        return (
                            <tr key={i} className={`mv__row ${clase}`}>
                                <td className="mv__addr">{row.address}</td>
                                <td className="mv__label">{row.label}</td>
                                <td className="mv__val">{row.value}</td>
                                <td className="mv__region">{row.region || row.flags || '—'}</td>
                                <td className="mv__status">
                                    <span className="mv__status-icon">{icon}</span>
                                    {row.status}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

/** Register file display */
export function RegisterFile({ registers = {} }) {
    const entries = Object.entries(registers)
    if (!entries.length) return null
    return (
        <div className="mv__regs">
            <p className="mv__regs-title">Registers</p>
            <div className="mv__regs-grid">
                {entries.map(([name, val]) => (
                    <div key={name} className="mv__reg">
                        <span className="mv__reg-name">{name}</span>
                        <span className="mv__reg-val">{val}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

/** ROP stack slice */
export function StackSlice({ stack = [] }) {
    if (!stack.length) return null
    return (
        <div className="mv__table-wrap">
            <table className="mv__table">
                <thead>
                    <tr><th>Offset</th><th>Value</th><th>Label</th></tr>
                </thead>
                <tbody>
                    {stack.map((entry, i) => (
                        <tr key={i} className="mv__row">
                            <td className="mv__addr">{entry.offset}</td>
                            <td className="mv__val">{entry.value}</td>
                            <td className="mv__label">{entry.label}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

/** ROP chain progress sidebar */
export function ChainProgress({ chain = [] }) {
    if (!chain.length) return null
    return (
        <div className="mv__chain">
            <p className="mv__regs-title">Chain Progress</p>
            <ol className="mv__chain-list">
                {chain.map((g) => (
                    <li
                        key={g.step}
                        className={`mv__chain-item
              ${g.done ? 'mv__chain-item--done' : ''}
              ${g.current ? 'mv__chain-item--current' : ''}`}
                    >
                        <span className="mv__chain-num">{g.step}</span>
                        <span className="mv__chain-gadget">{g.gadget}</span>
                    </li>
                ))}
            </ol>
        </div>
    )
}

/** Heap chunk table */
export function HeapTable({ chunks = [] }) {
    if (!chunks.length) return null
    return (
        <div className="mv__table-wrap">
            <table className="mv__table">
                <thead>
                    <tr><th>Address</th><th>Label</th><th>Size</th><th>Flags</th><th>Data/Ptr</th><th>Status</th></tr>
                </thead>
                <tbody>
                    {chunks.map((c, i) => {
                        const { icon, clase } = statusMeta(c.status)
                        return (
                            <tr key={i} className={`mv__row ${clase}`}>
                                <td className="mv__addr">{c.address}</td>
                                <td className="mv__label">{c.label}</td>
                                <td className="mv__val" style={{ fontFamily: 'inherit' }}>{c.size}B</td>
                                <td className="mv__region">{c.flags}</td>
                                <td className="mv__val mv__data">{c.data}</td>
                                <td className="mv__status">
                                    <span className="mv__status-icon">{icon}</span>
                                    {c.status}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
