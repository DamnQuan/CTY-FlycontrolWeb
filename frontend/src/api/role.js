import request from '@/utils/request'

export const getRoleList = () => {
  return request.get('/roles')
}

export const createRole = (data) => {
  return request.post('/roles', data)
}

export const updateRole = (id, data) => {
  return request.put(`/roles/${id}`, data)
}

export const deleteRole = (id) => {
  return request.delete(`/roles/${id}`)
}

export const updateRolePermissions = (id, data) => {
  return request.put(`/roles/${id}/permissions`, data)
}
