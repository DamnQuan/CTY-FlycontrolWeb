import request from '@/utils/request'

// 获取用户权限
export const getUserPermissions = (userId) => {
  return request.get(`/users/${userId}/permissions`)
}

// 更新用户权限
export const updateUserPermissions = (userId, permissions) => {
  return request.put(`/users/${userId}/permissions`, { permissions })
}

// 获取所有权限列表
export const getAllPermissions = () => {
  return request.get('/permissions')
}
