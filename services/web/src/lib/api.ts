import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('vendora_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  const locale = Cookies.get('NEXT_LOCALE') || 'hy'
  config.headers['Accept-Language'] = locale

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('vendora_token')
      Cookies.remove('vendora_role')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

export default api
