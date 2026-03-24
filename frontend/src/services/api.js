/**
 * services/api.js
 * ───────────────
 * Base Axios instance for all backend API calls.
 * All requests go to same-origin /api/* (proxied by Vite to :5000 in dev).
 *
 * Phase 5 will add: auth interceptor for admin token (curl/Postman only).
 */
import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// ── Response interceptor ──────────────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            // Network error — backend offline
            console.warn('[API] Backend offline or network error')
            return Promise.reject({ type: 'network', message: 'Backend is offline.' })
        }

        const { status, data } = error.response
        switch (status) {
            case 429:
                return Promise.reject({ type: 'rate_limit', message: 'Rate limit exceeded. Please wait.' })
            case 401:
                return Promise.reject({ type: 'auth', message: 'Unauthorized.' })
            case 501:
                return Promise.reject({ type: 'not_implemented', message: 'Feature not yet implemented.' })
            default:
                return Promise.reject({ type: 'api_error', status, message: data?.error || 'An error occurred.' })
        }
    }
)

// ── Public endpoints ──────────────────────────────────────────────

export const getProjects = (params = {}) => api.get('/projects', { params })
export const getProject = (slug) => api.get(`/projects/${slug}`)

export const getBlogPosts = (params = {}) => api.get('/blog', { params })
export const getBlogPost = (slug) => api.get(`/blog/${slug}`)

export const getLabEntries = (params = {}) => api.get('/lab', { params })
export const uploadLabFile = (formData) =>
    api.post('/lab/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })

export const checkHealth = () => api.get('/health')

export const runSimulation = (simType, params = {}) =>
    api.post(`/simulation/${simType}`, params)

export default api
