import axios from 'axios'

const BASE_URL = 'http://127.0.0.1:8000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
})

export const setupAxiosInterceptor = (getToken) => {
  api.interceptors.request.use(async (config) => {
    try {
      const companyToken = localStorage.getItem('company_token')
      if (companyToken) {
        config.headers.Authorization = `Bearer ${companyToken}`
        return config
      }
      const token = await Promise.race([
        getToken(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ])
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (e) {}
    return config
  })
}

// ─── Auth ─────────────────────────────────────────────
export const login = (data) => api.post('/auth/login', data)
export const companyLogin = (data) => api.post('/auth/login', data)
export const checkManagerEmail = (email) => api.get(`/admin/check-manager?email=${encodeURIComponent(email)}`)
export const checkRepresentativeEmail = (email) => api.get(`/admin/check-representative?email=${encodeURIComponent(email)}`)

// ─── Admin / Company ──────────────────────────────────
export const registerCompany = (data) => api.post('/admin/register', data)
export const getCompanyProfile = () => api.get('/admin/me')
export const updateCompanyProfile = (data) => api.put('/admin/me', data)
export const deleteCompanyProfile = () => api.delete('/admin/me')
export const triggerDigest = () => api.post('/admin/digest')
export const getAnalytics = () => api.get('/admin/analytics')
export const addManager = (data) => api.post('/admin/managers', data)
export const addRepresentative = (data) => api.post('/admin/representatives', data)
export const getCompanyBySlug = (slug) => api.get(`/admin/by-slug/${slug}`)

// ─── Representative ───────────────────────────────────
export const getRepProfile = () => api.get('/representative/me')
export const updateRepProfile = (data) => api.put('/representative/me', data)
export const getCompanyTeam = () => api.get('/representative/team')

// ─── Conversation ─────────────────────────────────────
export const createConversation = (data, companyId) =>
  api.post('/conversation/', data, {
    headers: { 'X-Company-ID': companyId }
  })
export const getAllConversations = () => api.get('/conversation/')
export const getConversation = (id) => api.get(`/conversation/${id}`)
export const closeConversation = (id) => api.put(`/conversation/${id}/close`)

// ─── Messages ─────────────────────────────────────────
export const sendCustomerMessage = (conversationId, data, companyId) =>
  api.post(`/conversation/${conversationId}/message`, data, {
    headers: { 'X-Company-ID': companyId }
  })
export const sendRepMessage = (conversationId, data) =>
  api.post(`/conversation/${conversationId}/representative-message`, data)

// ─── Digest ───────────────────────────────────────────
export const sendDigest = () => api.post('/admin/digest')

export const getConversationsByCompany = (companyId) => 
  api.get(`/conversation/by-company/${companyId}`)

export default api