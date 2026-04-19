import request from '@/utils/request'

// 提交管制员申请
export const submitApplication = (data) => {
  return request.post('/controller-applications', data)
}

// 获取我的申请
export const getMyApplications = () => {
  return request.get('/controller-applications/my')
}

// 删除申请（取消）
export const cancelApplication = (id) => {
  return request.delete(`/controller-applications/${id}`)
}

// 获取申请列表（管理员）
export const getApplicationList = (params) => {
  return request.get('/controller-applications', { params })
}

// 获取申请详情
export const getApplicationDetail = (id) => {
  return request.get(`/controller-applications/${id}`)
}

// 审核申请
export const reviewApplication = (id, data) => {
  return request.put(`/controller-applications/${id}/review`, data)
}
