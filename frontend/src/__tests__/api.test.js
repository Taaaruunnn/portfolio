/**
 * src/__tests__/api.test.js
 * ──────────────────────────
 * Unit tests for the Axios-based API service layer.
 *
 * Uses vi.hoisted() so the mock instance is available before module imports
 * (Vitest hoists vi.mock() calls, so the instance must be created with vi.hoisted).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── 1. Create the mock instance BEFORE vi.mock hoisting ────────────
const mockAxiosInstance = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    interceptors: { response: { use: vi.fn((ok, err) => { }) } },
}))

// ── 2. Mock axios — factory returns our pre-created instance ────────
vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => mockAxiosInstance),
    },
}))

// ── 3. Now import the module under test ────────────────────────────
import {
    getProjects,
    getBlogPosts,
    getBlogPost,
    getLabEntries,
    runSimulation,
    checkHealth,
} from '@/services/api'

// ── Helpers ────────────────────────────────────────────────────────
function mockSuccess(method, data) {
    mockAxiosInstance[method].mockResolvedValueOnce({ data })
}

// ── Endpoint routing tests ─────────────────────────────────────────

describe('API service routing', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('getProjects calls GET /projects', async () => {
        mockSuccess('get', { items: [] })
        await getProjects()
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/projects', expect.any(Object))
    })

    it('getBlogPosts calls GET /blog', async () => {
        mockSuccess('get', { items: [] })
        await getBlogPosts()
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/blog', expect.any(Object))
    })

    it('getBlogPost calls GET /blog/:slug', async () => {
        mockSuccess('get', { slug: 'my-slug', title: 'Test' })
        await getBlogPost('my-slug')
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/blog/my-slug')
    })

    it('getLabEntries calls GET /lab', async () => {
        mockSuccess('get', { items: [] })
        await getLabEntries()
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/lab', expect.any(Object))
    })

    it('runSimulation posts to /simulation/:type with params', async () => {
        mockSuccess('post', { type: 'stack_bof', step: 1 })
        await runSimulation('stack', { step: 1 })
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/simulation/stack', { step: 1 })
    })

    it('checkHealth calls GET /health', async () => {
        mockSuccess('get', { status: 'ok' })
        await checkHealth()
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health')
    })
})

// ── Return value tests ─────────────────────────────────────────────

describe('API service return values', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('getProjects resolves with response data', async () => {
        const payload = { items: [{ id: 1, title: 'Test' }], total: 1 }
        mockSuccess('get', payload)
        const res = await getProjects()
        expect(res.data).toEqual(payload)
    })

    it('runSimulation resolves with simulation data', async () => {
        const payload = { type: 'stack_bof', step: 3, total_steps: 5 }
        mockSuccess('post', payload)
        const res = await runSimulation('stack', { step: 3 })
        expect(res.data.type).toBe('stack_bof')
        expect(res.data.step).toBe(3)
    })
})
