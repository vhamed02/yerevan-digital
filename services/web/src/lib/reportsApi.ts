import axios from 'axios'
import Cookies from 'js-cookie'

const reportsApi = axios.create({
  baseURL: '/api/admin-reports',
  headers: { 'Content-Type': 'application/json' },
})

reportsApi.interceptors.request.use((config) => {
  const token = Cookies.get('yerevan_digital_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default reportsApi
