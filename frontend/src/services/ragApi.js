/**
 * services/ragApi.js
 * ────────────────────
 * Axios calls for the RAG / SecureAI endpoints.
 * Phase 4 will implement the actual pipeline.
 */
import api from './api'

/**
 * POST /api/rag/query
 * @param {string} question - User's security question
 * @returns {Promise<{answer: string, sources: Array}>}
 */
export async function queryRAG(question) {
    if (!question || question.trim().length === 0) {
        throw { type: 'validation', message: 'Question cannot be empty.' }
    }
    if (question.trim().length > 1000) {
        throw { type: 'validation', message: 'Question exceeds 1000 character limit.' }
    }

    const response = await api.post('/rag/query', { question: question.trim() })
    return response.data
}
