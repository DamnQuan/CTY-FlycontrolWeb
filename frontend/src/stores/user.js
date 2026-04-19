import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Cookies from 'js-cookie'
import request from '@/utils/request'

// 管理权限列表
const ADMIN_PERMISSIONS = [
  'user:view', 'user:create', 'user:update', 'user:delete',
  'activity:view', 'activity:create', 'activity:update', 'activity:delete',
  'ticket:view', 'ticket:create', 'ticket:update', 'ticket:delete', 'ticket:assign',
  'controller:view', 'controller:review',
  'permission:view', 'permission:grant',
  'audit:view',
  'settings:view', 'settings:update'
]

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref(Cookies.get('token') || '')
  const userInfo = ref(null)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  
  // 检查是否有特定权限
  const hasPermission = computed(() => (permission) => {
    if (!userInfo.value) return false
    return userInfo.value.permissions?.includes(permission) || false
  })
  
  // 检查是否有任意管理权限
  const hasAnyAdminPermission = computed(() => {
    if (!userInfo.value?.permissions) return false
    return ADMIN_PERMISSIONS.some(p => userInfo.value.permissions.includes(p))
  })

  // Actions
  const setToken = (newToken) => {
    token.value = newToken
    Cookies.set('token', newToken, { expires: 7 })
  }

  const setUserInfo = (info) => {
    userInfo.value = info
  }

  const login = async (credentials) => {
    const res = await request.post('/auth/login', credentials)
    setToken(res.data.token)
    setUserInfo(res.data.user)
    return res
  }

  const register = async (data) => {
    const res = await request.post('/auth/register', data)
    setToken(res.data.token)
    setUserInfo(res.data.user)
    return res
  }

  const logout = async () => {
    try {
      await request.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }
    token.value = ''
    userInfo.value = null
    Cookies.remove('token')
  }

  const fetchUserInfo = async () => {
    try {
      const res = await request.get('/auth/me')
      setUserInfo(res.data)
      return res.data
    } catch (error) {
      logout()
      throw error
    }
  }

  const updateProfile = async (data) => {
    const res = await request.put('/profile', data)
    setUserInfo({ ...userInfo.value, ...res.data })
    return res
  }

  const changePassword = async (data) => {
    return await request.put('/auth/password', data)
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    hasPermission,
    hasAnyAdminPermission,
    setToken,
    setUserInfo,
    login,
    register,
    logout,
    fetchUserInfo,
    updateProfile,
    changePassword
  }
})
